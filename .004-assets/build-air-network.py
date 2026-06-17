#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-air-network.py — 把 OpenFlights 的 airports.dat + routes.dat
烘焙成本素材运行时直接读取的 air-network.json。

输出结构（坐标统一 [lng, lat]，与 d3 投影输入一致）：
{
  "meta":     { "airports": N, "routes": M, "source": "OpenFlights (ODbL)" },
  "airports": { "PEK": [116.5874, 40.0801], ... },          # 仅保留被航线引用到的机场
  "routes":   { "PEK": [["NRT", 9], ["ICN", 12], ...], ... } # 出向边，weight = 该航段的航司条数
}

数据源（Open Database License）：
  https://github.com/jpatokal/openflights/tree/master/data

用法：
  python3 build-air-network.py            # /tmp 没有 .dat 就自动下载
本脚本是开发期工具，不参与页面运行；产物 air-network.json 才是运行时依赖。
"""
import csv
import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "air-network.json")

RAW = "https://raw.githubusercontent.com/jpatokal/openflights/master/data"
SRC = {
    "airports": os.environ.get("AIRPORTS_DAT", "/tmp/openflights/airports.dat"),
    "routes":   os.environ.get("ROUTES_DAT",   "/tmp/openflights/routes.dat"),
}


def ensure(path, name):
    if os.path.exists(path):
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    url = f"{RAW}/{name}.dat"
    print(f"downloading {url} -> {path}")
    urllib.request.urlretrieve(url, path)
    return path


def is_iata(code):
    return isinstance(code, str) and len(code) == 3 and code.isalpha() and code.isupper()


def main():
    ap_path = ensure(SRC["airports"], "airports")
    rt_path = ensure(SRC["routes"], "routes")

    # IATA -> [lng, lat]，仅收录有合法 IATA 与坐标的机场
    coords = {}
    with open(ap_path, encoding="utf-8") as f:
        for row in csv.reader(f):
            # 0 id,1 name,2 city,3 country,4 IATA,5 ICAO,6 lat,7 lng,...
            if len(row) < 8:
                continue
            iata = row[4].strip()
            if not is_iata(iata):
                continue
            try:
                lat = float(row[6]); lng = float(row[7])
            except ValueError:
                continue
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                continue
            coords[iata] = [round(lng, 4), round(lat, 4)]

    # (src,dst) -> weight（航司条数）；两端都得有坐标
    weight = {}
    with open(rt_path, encoding="utf-8") as f:
        for row in csv.reader(f):
            # 0 airline,1 airlineID,2 srcIATA,3 srcID,4 dstIATA,5 dstID,...
            if len(row) < 5:
                continue
            s = row[2].strip(); d = row[4].strip()
            if s == d or s not in coords or d not in coords:
                continue
            weight[(s, d)] = weight.get((s, d), 0) + 1

    # 组装出向邻接表，并只保留实际被引用到的机场坐标
    routes = {}
    used = set()
    for (s, d), w in weight.items():
        routes.setdefault(s, []).append([d, w])
        used.add(s); used.add(d)
    for s in routes:
        routes[s].sort(key=lambda e: -e[1])  # 按繁忙度降序，前端取 topN 就是最忙的几条

    airports = {k: coords[k] for k in used}

    out = {
        "meta": {
            "airports": len(airports),
            "routes": len(weight),
            "source": "OpenFlights (ODbL) https://openflights.org/data",
        },
        "airports": airports,
        "routes": routes,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    size = os.path.getsize(OUT)
    print(f"airports(referenced)={len(airports)}  unique_edges={len(weight)}  "
          f"src_nodes={len(routes)}  -> {OUT}  ({size/1024:.0f} KB)")


if __name__ == "__main__":
    sys.exit(main())
