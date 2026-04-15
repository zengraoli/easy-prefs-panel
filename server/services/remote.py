import paramiko
from typing import Optional


def create_ssh_client(
    ip: str,
    port: int,
    username: str,
    auth_method: str,
    password: Optional[str] = None,
    key_path: Optional[str] = None,
) -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    if auth_method == "key":
        key = paramiko.RSAKey.from_private_key_file(key_path) if key_path else None
        client.connect(ip, port=port, username=username, pkey=key, timeout=10)
    else:
        client.connect(ip, port=port, username=username, password=password, timeout=10)

    return client


def test_connection(
    ip: str,
    port: int,
    username: str,
    auth_method: str,
    password: Optional[str] = None,
    key_path: Optional[str] = None,
) -> dict:
    try:
        client = create_ssh_client(ip, port, username, auth_method, password, key_path)
        stdin, stdout, stderr = client.exec_command("echo ok && uname -a")
        output = stdout.read().decode().strip()
        client.close()
        return {"success": True, "message": output}
    except Exception as e:
        return {"success": False, "message": str(e)}


def deploy_and_run(
    ip: str,
    port: int,
    username: str,
    auth_method: str,
    script_content: str,
    password: Optional[str] = None,
    key_path: Optional[str] = None,
) -> dict:
    try:
        client = create_ssh_client(ip, port, username, auth_method, password, key_path)
        sftp = client.open_sftp()

        remote_path = "/tmp/scrapling_task.py"
        with sftp.file(remote_path, "w") as f:
            f.write(script_content)
        sftp.close()

        stdin, stdout, stderr = client.exec_command(f"python3 {remote_path}")
        output = stdout.read().decode()
        errors = stderr.read().decode()
        client.close()

        return {"success": True, "output": output, "errors": errors}
    except Exception as e:
        return {"success": False, "message": str(e)}


def get_system_stats(
    ip: str,
    port: int,
    username: str,
    auth_method: str,
    password: Optional[str] = None,
    key_path: Optional[str] = None,
) -> dict:
    try:
        client = create_ssh_client(ip, port, username, auth_method, password, key_path)

        # CPU usage
        _, cpu_out, _ = client.exec_command(
            "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'"
        )
        cpu = cpu_out.read().decode().strip()

        # Memory usage
        _, mem_out, _ = client.exec_command(
            "free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100}'"
        )
        mem = mem_out.read().decode().strip()

        client.close()
        return {
            "online": True,
            "cpu_percent": float(cpu) if cpu else 0,
            "mem_percent": float(mem) if mem else 0,
        }
    except Exception:
        return {"online": False, "cpu_percent": 0, "mem_percent": 0}
