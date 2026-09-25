import os
import time
import urllib.request
from pathlib import Path

URL = "https://releases.ubuntu.com/24.04.2/ubuntu-24.04.2-desktop-amd64.iso"
OUT = Path.home() / "Downloads" / "ubuntu-24.04.2-desktop-amd64.iso"
CHUNK = 8 * 1024 * 1024
MAX_RETRIES = 30


def get_total_size(url: str) -> int:
    req = urllib.request.Request(url, method="HEAD")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return int(resp.headers.get("Content-Length", "0"))


def main() -> int:
    OUT.parent.mkdir(parents=True, exist_ok=True)

    total = get_total_size(URL)
    retries = 0

    while True:
        existing = OUT.stat().st_size if OUT.exists() else 0
        if total and existing >= total:
            print(f"Complete: {OUT}")
            print(f"Size: {existing} bytes")
            return 0

        headers = {}
        mode = "wb"
        if existing > 0:
            headers["Range"] = f"bytes={existing}-"
            mode = "ab"

        req = urllib.request.Request(URL, headers=headers)

        try:
            with urllib.request.urlopen(req, timeout=120) as resp, open(OUT, mode) as fh:
                while True:
                    chunk = resp.read(CHUNK)
                    if not chunk:
                        break
                    fh.write(chunk)

                    current = OUT.stat().st_size
                    if total:
                        pct = (current / total) * 100
                        print(f"Downloaded: {current}/{total} bytes ({pct:.2f}%)")
                    else:
                        print(f"Downloaded: {current} bytes")

            retries = 0

        except Exception as exc:
            retries += 1
            print(f"Connection interrupted ({retries}/{MAX_RETRIES}): {exc}")
            if retries >= MAX_RETRIES:
                print("Too many retries. Exiting.")
                return 1
            time.sleep(5)


if __name__ == "__main__":
    raise SystemExit(main())
