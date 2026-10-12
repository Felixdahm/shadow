# Rendert Juros Körperteile als saubere Einzelteile (transparenter Grund)
# für den Puppen-Renderer. Headless ausführen:
#   blender -b --python tools/blender-juro.py
# Gibt am Ende die TEILE-Tabelle (Pixel-Koordinaten) für src/puppe.js aus.
import bpy
import math
import json

# ---------- Szene vorbereiten ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
szene = bpy.context.scene
szene.render.resolution_x = 1024
szene.render.resolution_y = 1024
szene.render.film_transparent = True
try:
    szene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception:
    szene.render.engine = 'BLENDER_EEVEE'
# Umriss-Linien für den Spiel-Look (Line-Set muss in leerer Szene angelegt werden)
szene.render.use_freestyle = True
szene.render.line_thickness = 2.0
fs = szene.view_layers[0].freestyle_settings
lineset = fs.linesets.new('Umriss')
lineset.select_silhouette = True
lineset.select_border = True
lineset.select_crease = True

# Orthokamera: schaut von +Y auf die XZ-Ebene, 10 Welteinheiten breit
ORTHO = 10.0
PX_PRO_EINHEIT = 1024 / ORTHO
kam_daten = bpy.data.cameras.new('Kamera')
kam_daten.type = 'ORTHO'
kam_daten.ortho_scale = ORTHO
kamera = bpy.data.objects.new('Kamera', kam_daten)
kamera.location = (0, 12, 0)
kamera.rotation_euler = (math.radians(90), 0, math.radians(180))
szene.collection.objects.link(kamera)
szene.camera = kamera

# Licht: Sonne von vorn-oben-links + Umgebungslicht
sonne_daten = bpy.data.lights.new('Sonne', type='SUN')
sonne_daten.energy = 3.5
sonne = bpy.data.objects.new('Sonne', sonne_daten)
sonne.rotation_euler = (math.radians(55), math.radians(-15), math.radians(195))
szene.collection.objects.link(sonne)
welt = bpy.data.worlds.new('Welt')
szene.world = welt
welt.use_nodes = True
hintergrund = welt.node_tree.nodes['Background']
hintergrund.inputs[0].default_value = (0.8, 0.8, 0.85, 1)
hintergrund.inputs[1].default_value = 0.45

# ---------- Materialien ----------
def material(name, farbe, rauheit=0.85):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*farbe, 1)
    p.inputs['Roughness'].default_value = rauheit
    return m

HAUT = material('haut', (0.85, 0.55, 0.36))
HAAR = material('haar', (0.055, 0.07, 0.13))
JACKE = material('jacke', (0.09, 0.13, 0.26))
MANTEL = material('mantel', (0.06, 0.09, 0.19))
HOSE = material('hose', (0.10, 0.12, 0.18))
ROT = material('rot', (0.55, 0.10, 0.10))
STIEFEL = material('stiefel', (0.23, 0.14, 0.09))
BRAUN = material('leder', (0.30, 0.19, 0.11))

def setze(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    f = obj.modifiers.new('Bevel', 'BEVEL')
    f.width = 0.03
    f.segments = 2

def kugel(x, z, r, mat, sx=1, sy=1, sz=1):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(x, 0, z), segments=24, ring_count=16)
    o = bpy.context.object
    o.scale = (sx, sy, sz)
    setze(o, mat)
    return o

def zylinder(x, z, r, laenge, mat, sy=None):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=laenge, location=(x, 0, z), vertices=24)
    o = bpy.context.object
    if sy:
        o.scale[1] = sy
    setze(o, mat)
    return o

def quader(x, z, bx, by, bz, mat, y=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    o = bpy.context.object
    o.scale = (bx, by, bz)
    setze(o, mat)
    return o

def kegel(x, z, r, laenge, mat, neigung=0.0):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0.01, depth=laenge, location=(x, 0, z))
    o = bpy.context.object
    o.rotation_euler[1] = neigung
    setze(o, mat)
    return o

def stumpf(x, z_oben, r_oben, z_unten, r_unten, mat, sy=0.8):
    """Konisches Gliedmaßen-Stück: oben dick, zum Gelenk schlank — kein Röhren-Look"""
    mitte = (z_oben + z_unten) / 2
    laenge = abs(z_oben - z_unten)
    bpy.ops.mesh.primitive_cone_add(radius1=r_oben, radius2=r_unten, depth=laenge, location=(x, 0, mitte), vertices=24)
    o = bpy.context.object
    o.scale[1] = sy
    setze(o, mat)
    return o

# ---------- Teile bauen (jedes in eigener Zelle, Anker = oben/unten) ----------
TEILE = {}

def anker(name, x, z_oben, z_unten, halbbreite, rand=0.25):
    def px(wx):
        return round(512 - wx * PX_PRO_EINHEIT)
    def py(wz):
        return round(512 - wz * PX_PRO_EINHEIT)
    TEILE[name] = {
        'x': px(x + halbbreite), 'y': py(z_oben + rand),
        'w': px(x - halbbreite) - px(x + halbbreite),
        'h': py(z_unten - rand) - py(z_oben + rand),
        'von': [px(x), py(z_oben)], 'bis': [px(x), py(z_unten)],
    }

# ---- Kopf: Schädel + Kiefer + Ohr + Haarschopf + Stirnband ----
KX, KZ = -3.4, 2.6
kugel(KX, KZ + 0.68, 0.5, HAUT, sx=0.95, sz=1.12)          # Schädel
kugel(KX - 0.16, KZ + 0.38, 0.3, HAUT, sx=1.05, sz=0.8)    # Kiefer (vorn = Bild rechts)
kugel(KX + 0.3, KZ + 0.6, 0.09, HAUT, sx=0.5, sz=0.9)      # Ohr
kugel(KX + 0.12, KZ + 1.02, 0.52, HAAR, sx=0.95, sz=0.72)  # Haarkappe (nach hinten)
for dx, dz, neig in [(-0.34, 1.32, -0.55), (-0.1, 1.5, -0.2), (0.18, 1.52, 0.25), (0.44, 1.38, 0.65), (0.6, 1.1, 1.0)]:
    kegel(KX + dx, KZ + dz, 0.15, 0.5, HAAR, neigung=neig)
zylinder(KX, KZ + 0.76, 0.52, 0.13, ROT, sy=0.8)           # Stirnband
kugel(KX + 0.66, KZ + 0.62, 0.09, ROT, sx=2.4, sz=0.4)     # Band-Enden wehen nach hinten
kugel(KX + 0.72, KZ + 0.44, 0.07, ROT, sx=2.0, sz=0.35)
anker('kopf', KX, KZ + 1.35, KZ + 0.05, 1.2)
TEILE['kopf']['von'], TEILE['kopf']['bis'] = TEILE['kopf']['bis'], TEILE['kopf']['von']

# ---- Torso: geformte Brust, Taille, Mantel mit schrägem Saum, Schal, Schulterkappe ----
TX, TZ = -1.1, 2.9
kugel(TX, TZ - 0.55, 0.56, JACKE, sx=1.0, sy=0.55, sz=0.85)   # Brustkorb (geformt)
stumpf(TX, TZ - 1.0, 0.44, TZ - 1.62, 0.34, JACKE, sy=0.55)   # Taille (verjüngt)
zylinder(TX, TZ - 1.66, 0.4, 0.16, ROT, sy=0.6)               # Gürtel
stumpf(TX, TZ - 1.7, 0.42, TZ - 2.5, 0.58, MANTEL, sy=0.5)    # Mantel flared
k = kugel(TX - 0.05, TZ - 2.52, 0.56, MANTEL, sx=1.0, sy=0.48, sz=0.22)  # Saum-Schwung
kugel(TX, TZ - 0.18, 0.36, ROT, sx=1.25, sy=0.8, sz=0.5)      # Schal
kugel(TX - 0.3, TZ - 0.1, 0.16, ROT, sx=0.8, sz=1.4)          # Schal-Knoten vorn
anker('torso', TX, TZ - 0.3, TZ - 1.7, 1.0, rand=0.5)

# ---- Oberarm: Schulterkappe + konischer Ärmel + Ellbogenbund ----
AX, AZ = 1.0, 3.0
kugel(AX, AZ - 0.08, 0.3, JACKE, sz=0.85)                 # Schulterkappe (deckt Ansatz)
stumpf(AX, AZ - 0.15, 0.24, AZ - 1.05, 0.15, JACKE)       # Ärmel konisch
zylinder(AX, AZ - 1.02, 0.18, 0.14, MANTEL, sy=0.8)       # Ärmelbund (deckt Ellbogen)
anker('oberarm', AX, AZ, AZ - 1.1, 0.5)

# ---- Unterarm: konisch + Armschiene + Faust mit Daumen ----
UX, UZ = 2.3, 3.0
stumpf(UX, UZ - 0.02, 0.17, UZ - 0.78, 0.12, JACKE)
stumpf(UX, UZ - 0.42, 0.2, UZ - 0.8, 0.16, BRAUN)          # Armschiene
kugel(UX, UZ - 0.98, 0.18, HAUT, sz=1.1)                   # Faust
kugel(UX - 0.14, UZ - 0.92, 0.08, HAUT)                    # Daumen
anker('unterarm', UX, UZ, UZ - 1.0, 0.45)

# ---- Oberschenkel: konisch, Kniebund ----
SX, SZ = 1.0, 0.6
kugel(SX, SZ - 0.05, 0.28, HOSE, sz=0.8)
stumpf(SX, SZ - 0.1, 0.26, SZ - 1.2, 0.16, HOSE)
zylinder(SX, SZ - 1.18, 0.19, 0.14, HOSE, sy=0.8)          # Hosensaum deckt Knie
anker('schenkel', SX, SZ, SZ - 1.3, 0.5)

# ---- Unterschenkel + Stiefel mit Ferse ----
BX, BZ = 2.6, 0.6
stumpf(BX, BZ - 0.02, 0.15, BZ - 0.68, 0.12, HOSE)
stumpf(BX, BZ - 0.62, 0.2, BZ - 1.2, 0.17, STIEFEL)        # Schaft (Saum oben breiter)
kugel(BX - 0.18, BZ - 1.26, 0.17, STIEFEL, sx=1.5, sz=0.55)  # Fußspitze (Bild: rechts)
kugel(BX + 0.1, BZ - 1.28, 0.12, STIEFEL, sx=0.9, sz=0.6)    # Ferse
anker('schienbein', BX, BZ, BZ - 1.3, 0.55)

# ---------- Rendern ----------
import os
ziel = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'teile', 'juro-blender.png')
szene.render.filepath = ziel
bpy.ops.render.render(write_still=True)
print('GERENDERT:', ziel)
print('TEILE_JSON=' + json.dumps(TEILE))
