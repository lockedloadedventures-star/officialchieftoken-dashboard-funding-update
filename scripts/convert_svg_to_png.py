# This script converts chief-coin.svg to chief-coin.png using CairoSVG
import cairosvg

cairosvg.svg2png(url="chiefcoinlogo/chief-coin.svg", write_to="chiefcoinlogo/chief-coin.png")
print("SVG converted to PNG: chiefcoinlogo/chief-coin.png")
