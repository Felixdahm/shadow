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

# ---------- Teile bauen (jedes in eigener Zelle, Anker = oben/unten) ----------
TEILE = {}

def anker(name, x, z_oben, z_unten, halbbreite, rand=0.25):
    """Pixel-Rechteck + Anker für puppe.js berechnen"""
    def px(wx):
        # Kamera spiegelt X: Welt +X erscheint im Bild links
        return round(512 - wx * PX_PRO_EINHEIT)
    def py(wz):
        return round(512 - wz * PX_PRO_EINHEIT)
    TEILE[name] = {
        'x': px(x + halbbreite), 'y': py(z_oben + rand),
        'w': px(x - halbbreite) - px(x + halbbreite),
        'h': py(z_unten - rand) - py(z_oben + rand),
        'von': [px(x), py(z_oben)], 'bis': [px(x), py(z_unten)],
    }

# Kopf (mit Haarzacken + Stirnband), Anker: Hals → Scheitel
KX, KZ = -3.4, 2.6
kugel(KX, KZ + 0.62, 0.52, HAUT, sz=1.1)
kugel(KX - 0.05, KZ + 0.95, 0.5, HAAR, sz=0.75)       # Haarkappe
for i, (dx, dz, neig) in enumerate([(-0.4, 1.15, -0.7), (-0.18, 1.35, -0.3), (0.1, 1.4, 0.1), (0.35, 1.3, 0.5)]):
    kegel(KX + dx, KZ + dz, 0.16, 0.55, HAAR, neigung=neig)
zylinder(KX, KZ + 0.72, 0.545, 0.14, ROT)             # Stirnband
kugel(KX + 0.62, KZ + 0.55, 0.1, ROT, sx=2.2, sz=0.5) # Band weht nach hinten (Bild: links)
anker('kopf', KX, KZ + 1.35, KZ + 0.05, 1.15)
# Kopf-Anker drehen: von = Hals (unten) → bis = Scheitel (oben)
TEILE['kopf']['von'], TEILE['kopf']['bis'] = TEILE['kopf']['bis'], TEILE['kopf']['von']

# Torso mit Mantel (Anker: Schulter → Hüfte; Mantel hängt tiefer)
TX, TZ = -1.1, 2.9
quader(TX, TZ - 0.75, 0.52, 0.3, 0.85, JACKE)          # Brustkorb
quader(TX, TZ - 1.5, 0.42, 0.26, 0.7, JACKE)           # Bauch
quader(TX, TZ - 1.62, 0.46, 0.28, 0.16, ROT)           # Gürtel
quader(TX, TZ - 2.2, 0.5, 0.24, 1.1, MANTEL)           # Mantel-Schoß
kugel(TX, TZ - 0.28, 0.33, ROT, sx=1.3, sy=0.9, sz=0.55)  # Schal
anker('torso', TX, TZ - 0.3, TZ - 1.7, 0.95, rand=0.45)

# Oberarm (Schulter → Ellbogen)
AX, AZ = 1.0, 3.0
kugel(AX, AZ, 0.26, JACKE)
zylinder(AX, AZ - 0.55, 0.2, 1.1, JACKE)
anker('oberarm', AX, AZ, AZ - 1.1, 0.5)

# Unterarm mit Armschiene + Faust (Ellbogen → Hand)
UX, UZ = 2.3, 3.0
zylinder(UX, UZ - 0.4, 0.17, 0.8, JACKE)
zylinder(UX, UZ - 0.62, 0.19, 0.5, BRAUN)              # Armschiene
kugel(UX, UZ - 1.0, 0.2, HAUT)                         # Faust
anker('unterarm', UX, UZ, UZ - 1.0, 0.45)

# Oberschenkel (Hüfte → Knie)
SX, SZ = 1.0, 0.6
kugel(SX, SZ, 0.26, HOSE)
zylinder(SX, SZ - 0.65, 0.22, 1.3, HOSE)
anker('schenkel', SX, SZ, SZ - 1.3, 0.5)

# Unterschenkel + Stiefel (Knie → Ferse)
BX, BZ = 2.6, 0.6
zylinder(BX, BZ - 0.5, 0.18, 1.0, HOSE)
zylinder(BX, BZ - 1.05, 0.21, 0.5, STIEFEL)            # Schaft
quader(BX - 0.14, BZ - 1.32, 0.42, 0.2, 0.14, STIEFEL) # Fußspitze nach vorn (Bild: rechts)
anker('schienbein', BX, BZ, BZ - 1.3, 0.55)

# ---------- Rendern ----------
import os
ziel = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'teile', 'juro-blender.png')
szene.render.filepath = ziel
bpy.ops.render.render(write_still=True)
print('GERENDERT:', ziel)
print('TEILE_JSON=' + json.dumps(TEILE))
