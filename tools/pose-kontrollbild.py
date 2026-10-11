# Zeichnet das Rig-Männchen in der Schnitt-Pose als Kantenbild (für Canny-ControlNet).
# Pures Python ohne Bibliotheken: eigener PNG-Writer + Kapsel-Rasterizer.
# Ausgabe: assets/teile/pose-kontrolle.png + Gelenk-Koordinaten auf der Konsole.
import zlib
import struct
import math

B, H = 1024, 1024

# ---- Schnitt-Pose (Seitenansicht nach rechts, Teile überlappen nicht) ----
# Maßstab: Spiel-Einheiten × 3.4
M = 3.4
HUEFTE = (512, 600)
SCHULTER = (512, 600 - int(55 * M))             # Rumpf gerade hoch
KOPF = (518, SCHULTER[1] - int(23 * M))          # Hals + Kopfmitte
# Ein Arm, 45° nach vorn-unten gestreckt
ELLE = (SCHULTER[0] + int(36 * M * 0.707), SCHULTER[1] + int(36 * M * 0.707))
HAND = (ELLE[0] + int(34 * M * 0.707), ELLE[1] + int(34 * M * 0.707))
# Beine gespreizt: vorderes +20°, hinteres −20°
KNIE_V = (HUEFTE[0] + int(54 * M * 0.342), HUEFTE[1] + int(54 * M * 0.94))
FUSS_V = (KNIE_V[0] + int(52 * M * 0.087), KNIE_V[1] + int(52 * M * 0.996))
KNIE_H = (HUEFTE[0] - int(54 * M * 0.342), HUEFTE[1] + int(54 * M * 0.94))
FUSS_H = (KNIE_H[0] - int(52 * M * 0.087), KNIE_H[1] + int(52 * M * 0.996))

KOPF_R = int(13 * M)
RUMPF_R = int(11 * M)
ARM_R = int(6.5 * M)
BEIN_R = int(7.2 * M)

flaeche = bytearray(B * H)  # 0 = schwarz, 1 = Figur

def kapsel(a, b, r):
    (x1, y1), (x2, y2) = a, b
    minx = max(0, min(x1, x2) - r - 1)
    maxx = min(B - 1, max(x1, x2) + r + 1)
    miny = max(0, min(y1, y2) - r - 1)
    maxy = min(H - 1, max(y1, y2) + r + 1)
    dx, dy = x2 - x1, y2 - y1
    l2 = dx * dx + dy * dy or 1
    for y in range(miny, maxy + 1):
        for x in range(minx, maxx + 1):
            t = max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / l2))
            px, py = x1 + t * dx, y1 + t * dy
            if (x - px) ** 2 + (y - py) ** 2 <= r * r:
                flaeche[y * B + x] = 1

# Figur aufbauen
kapsel(HUEFTE, SCHULTER, RUMPF_R)                 # Rumpf
kapsel(KOPF, KOPF, KOPF_R)                        # Kopf
kapsel(SCHULTER, ELLE, ARM_R)                     # Oberarm
kapsel(ELLE, HAND, ARM_R)                         # Unterarm
kapsel(HUEFTE, KNIE_V, BEIN_R)                    # Oberschenkel vorn
kapsel(KNIE_V, FUSS_V, BEIN_R)                    # Unterschenkel vorn
kapsel(HUEFTE, KNIE_H, BEIN_R)                    # Oberschenkel hinten
kapsel(KNIE_H, FUSS_H, BEIN_R)                    # Unterschenkel hinten

# Kanten extrahieren (Figur-Pixel mit schwarzem Nachbarn) und 2 px dick zeichnen
px = bytearray(B * H * 3)
for y in range(1, H - 1):
    for x in range(1, B - 1):
        if flaeche[y * B + x] and (
            not flaeche[y * B + x - 1] or not flaeche[y * B + x + 1]
            or not flaeche[(y - 1) * B + x] or not flaeche[(y + 1) * B + x]
        ):
            for yy in (y - 1, y, y + 1):
                for xx in (x - 1, x, x + 1):
                    i = (yy * B + xx) * 3
                    px[i] = px[i + 1] = px[i + 2] = 255

def chunk(typ, daten):
    return struct.pack('>I', len(daten)) + typ + daten + struct.pack('>I', zlib.crc32(typ + daten) & 0xFFFFFFFF)

roh = b''.join(b'\x00' + bytes(px[y * B * 3:(y + 1) * B * 3]) for y in range(H))
png = (b'\x89PNG\r\n\x1a\n'
       + chunk(b'IHDR', struct.pack('>IIBBBBB', B, H, 8, 2, 0, 0, 0))
       + chunk(b'IDAT', zlib.compress(roh, 9))
       + chunk(b'IEND', b''))
open('assets/teile/pose-kontrolle.png', 'wb').write(png)

print('pose-kontrolle.png geschrieben (1024×1024)')
print('Gelenke:', dict(huefte=HUEFTE, schulter=SCHULTER, kopf=KOPF, elle=ELLE, hand=HAND,
                       knieV=KNIE_V, fussV=FUSS_V, knieH=KNIE_H, fussH=FUSS_H))
