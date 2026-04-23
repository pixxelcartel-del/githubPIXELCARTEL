from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
QP = Path(r"E:\Downloads\5054_w25_qp_21.pdf")
MS = Path(r"E:\Downloads\5054_w25_ms_21.pdf")
OUT = ROOT / "data" / "extracted"


def extract(path: Path) -> list[dict[str, str | int]]:
    reader = PdfReader(str(path))
    pages = []
    for index, page in enumerate(reader.pages, start=1):
        text = re.sub(r"\s+", " ", page.extract_text() or "").strip()
        pages.append({"page": index, "text": text})
    return pages


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "5054_w25_qp_21.pages.json").write_text(json.dumps(extract(QP), indent=2), encoding="utf-8")
    (OUT / "5054_w25_ms_21.pages.json").write_text(json.dumps(extract(MS), indent=2), encoding="utf-8")
    print(f"Wrote extracted text to {OUT}")


if __name__ == "__main__":
    main()
