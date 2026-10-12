# Rendert Juro ZUSAMMENGEBAUT in der Spreiz-Pose (für die KI-Übermalung)
# plus eine MASKE pro Körperteil (gleiche Position, Teil allein) — damit kann
# das Spiel die bemalten Teile pixelgenau ausstanzen.
#   blender -b --python tools/blender-juro.py
import bpy
import math
import json
import os

# ---------- Szene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
szene = bpy.context.scene
szene.render.resolution_x = 1024
szene.render.resolution_y = 1024
try:
    szene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception:
    szene.render.engine = 'BLENDER_EEVEE'
szene.render.use_freestyle = True
szene.render.line_thickness = 2.0
fs = szene.view_layers[0].freestyle_settings
lineset = fs.linesets.new('Umriss')
lineset.select_silhouette = True
lineset.select_border = True
lineset.select_crease = True

ORTHO = 8.0
PX = 1024 / ORTHO
kam_daten = bpy.data.cameras.new('Kamera')
kam_daten.type = 'ORTHO'
kam_daten.ortho_scale = ORTHO
kamera = bpy.data.objects.new('Kamera', kam_daten)
kamera.location = (0, 12, 2.4)
kamera.rotation_euler = (math.radians(90), 0, math.radians(180))
szene.collection.objects.link(kamera)
szene.camera = kamera

sonne_daten = bpy.data.lights.new('Sonne', type='SUN')
sonne_daten.energy = 3.5
sonne = bpy.data.objects.new('Sonne', sonne_daten)
sonne.rotation_euler = (math.radians(55), math.radians(-15), math.radians(195))
szene.collection.objects.link(sonne)
welt = bpy.data.worlds.new('Welt')
szene.world = welt
welt.use_nodes = True
hintergrund = welt.node_tree.nodes['Background']

def px(wx):
    return round(512 - wx * PX)  # Kamera spiegelt X: vorwärts (Bild rechts) = Welt -X

def py(wz):
    return round(512 - (wz - 2.4) * PX)  # Kamera-Mitte liegt auf z=2.4

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

def zylinder(x, z, r, laenge, mat, sy=0.8):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=laenge, location=(x, 0, z), vertices=24)
    o = bpy.context.object
    o.scale[1] = sy
    setze(o, mat)
    return o

def kegel(x, z, r, laenge, mat, neigung=0.0):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0.01, depth=laenge, location=(x, 0, z))
    o = bpy.context.object
    o.rotation_euler[1] = neigung
    setze(o, mat)
    return o

def stumpf(x, z_oben, r_oben, z_unten, r_unten, mat, sy=0.8):
    mitte = (z_oben + z_unten) / 2
    bpy.ops.mesh.primitive_cone_add(radius1=r_oben, radius2=r_unten, depth=abs(z_oben - z_unten), location=(x, 0, mitte), vertices=24)
    o = bpy.context.object
    o.scale[1] = sy
    setze(o, mat)
    return o

# ---------- Teil-Baukasten: baut am Ursprung (Gelenk oben, zeigt nach unten) ----------
def sammle(bauen):
    vorher = set(o.name for o in szene.objects)
    bauen()
    neu = [o for o in szene.objects if o.name not in vorher and o.type == 'MESH']
    for o in neu:
        o.select_set(True)
    bpy.context.view_layer.objects.active = neu[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    bpy.ops.object.select_all(action='DESELECT')
    return obj

def baue_kopf():
    def b():
        kugel(0, 0.63, 0.5, HAUT, sx=0.95, sz=1.12)
        kugel(-0.16, 0.33, 0.3, HAUT, sx=1.05, sz=0.8)
        kugel(0.3, 0.55, 0.09, HAUT, sx=0.5, sz=0.9)
        kugel(0.12, 0.97, 0.52, HAAR, sx=0.95, sz=0.72)
        for dx, dz, neig in [(-0.34, 1.27, -0.55), (-0.1, 1.45, -0.2), (0.18, 1.47, 0.25), (0.44, 1.33, 0.65), (0.6, 1.05, 1.0)]:
            kegel(dx, dz, 0.15, 0.5, HAAR, neigung=neig)
        zylinder(0, 0.71, 0.52, 0.13, ROT)
        kugel(0.66, 0.57, 0.09, ROT, sx=2.4, sz=0.4)
        kugel(0.72, 0.39, 0.07, ROT, sx=2.0, sz=0.35)
    return sammle(b)

def baue_torso():
    def b():
        kugel(0, -0.25, 0.56, JACKE, sy=0.55, sz=0.85)
        stumpf(0, -0.7, 0.44, -1.32, 0.34, JACKE, sy=0.55)
        zylinder(0, -1.36, 0.4, 0.16, ROT, sy=0.6)
        stumpf(0, -1.4, 0.42, -2.2, 0.58, MANTEL, sy=0.5)
        kugel(-0.05, -2.22, 0.56, MANTEL, sy=0.48, sz=0.22)
        kugel(0, 0.12, 0.36, ROT, sx=1.25, sy=0.8, sz=0.5)
        kugel(-0.3, 0.2, 0.16, ROT, sx=0.8, sz=1.4)
    return sammle(b)

def baue_oberarm():
    def b():
        kugel(0, -0.08, 0.3, JACKE, sz=0.85)
        stumpf(0, -0.15, 0.24, -1.05, 0.15, JACKE)
        zylinder(0, -1.02, 0.18, 0.14, MANTEL)
    return sammle(b)

def baue_unterarm():
    def b():
        stumpf(0, -0.02, 0.17, -0.78, 0.12, JACKE)
        stumpf(0, -0.42, 0.2, -0.8, 0.16, BRAUN)
        kugel(0, -0.98, 0.18, HAUT, sz=1.1)
        kugel(-0.14, -0.92, 0.08, HAUT)
    return sammle(b)

def baue_schenkel():
    def b():
        kugel(0, -0.05, 0.28, HOSE, sz=0.8)
        stumpf(0, -0.1, 0.26, -1.2, 0.16, HOSE)
        zylinder(0, -1.18, 0.19, 0.14, HOSE)
    return sammle(b)

def baue_schienbein():
    def b():
        stumpf(0, -0.02, 0.15, -0.68, 0.12, HOSE)
        stumpf(0, -0.62, 0.2, -1.2, 0.17, STIEFEL)
        kugel(-0.18, -1.26, 0.17, STIEFEL, sx=1.5, sz=0.55)
        kugel(0.1, -1.28, 0.12, STIEFEL, sx=0.9, sz=0.6)
    return sammle(b)

# ---------- Figur montieren (Spreiz-Pose; vorwärts = Welt -X = Bild rechts) ----------
def grad(w):
    return math.radians(w)

SCHULTER = (0.3, 3.4)
HUEFTE = (0.3, 2.0)
HALS = (0.3, 3.52)
L_OBERARM, L_UNTERARM, L_SCHENKEL, L_SCHIENBEIN = 1.1, 1.0, 1.3, 1.3

def kind(gelenk, winkel, laenge):
    return (gelenk[0] - math.sin(grad(winkel)) * laenge, gelenk[1] - math.cos(grad(winkel)) * laenge)

ELLE = kind(SCHULTER, 45, L_OBERARM)
HAND = kind(ELLE, 45, L_UNTERARM)
KNIE_V = kind(HUEFTE, 24, L_SCHENKEL)
FUSS_V = kind(KNIE_V, 28, L_SCHIENBEIN)
KNIE_H = kind(HUEFTE, -24, L_SCHENKEL)
FUSS_H = kind(KNIE_H, -28, L_SCHIENBEIN)
SCHEITEL = (HALS[0], HALS[1] + 1.33)

def platziere(obj, gelenk, winkel):
    obj.location = (gelenk[0], 0, gelenk[1])
    obj.rotation_euler[1] = grad(winkel)

teile = {}
teile['beinH_O'] = baue_schenkel();   platziere(teile['beinH_O'], HUEFTE, -24)
teile['beinH_U'] = baue_schienbein(); platziere(teile['beinH_U'], KNIE_H, -28)
teile['beinV_O'] = baue_schenkel();   platziere(teile['beinV_O'], HUEFTE, 24)
teile['beinV_U'] = baue_schienbein(); platziere(teile['beinV_U'], KNIE_V, 28)
teile['torso'] = baue_torso();        platziere(teile['torso'], SCHULTER, 0)
teile['kopf'] = baue_kopf();          platziere(teile['kopf'], HALS, 0)
teile['armO'] = baue_oberarm();       platziere(teile['armO'], SCHULTER, 45)
teile['armU'] = baue_unterarm();      platziere(teile['armU'], ELLE, 45)

# ---------- Rendern: 1× Figur (weiß) + 1 Maske pro Teil (transparent) ----------
basis = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'teile', 'juro')
os.makedirs(basis, exist_ok=True)

szene.render.film_transparent = False
hintergrund.inputs[0].default_value = (1, 1, 1, 1)
hintergrund.inputs[1].default_value = 1.0
szene.render.filepath = os.path.join(basis, 'koerper.png')
bpy.ops.render.render(write_still=True)
print('GERENDERT:', szene.render.filepath)

szene.render.film_transparent = True
szene.render.use_freestyle = False  # Masken brauchen keine Linien
for name, obj in teile.items():
    for n2, o2 in teile.items():
        o2.hide_render = (n2 != name)
    szene.render.filepath = os.path.join(basis, f'maske-{name}.png')
    bpy.ops.render.render(write_still=True)
    print('MASKE:', name)

GELENKE = {
    'schulter': [px(SCHULTER[0]), py(SCHULTER[1])],
    'huefte': [px(HUEFTE[0]), py(HUEFTE[1])],
    'hals': [px(HALS[0]), py(HALS[1])],
    'scheitel': [px(SCHEITEL[0]), py(SCHEITEL[1])],
    'elle': [px(ELLE[0]), py(ELLE[1])],
    'hand': [px(HAND[0]), py(HAND[1])],
    'knieV': [px(KNIE_V[0]), py(KNIE_V[1])],
    'fussV': [px(FUSS_V[0]), py(FUSS_V[1])],
    'knieH': [px(KNIE_H[0]), py(KNIE_H[1])],
    'fussH': [px(FUSS_H[0]), py(FUSS_H[1])],
}
print('GELENKE_JSON=' + json.dumps(GELENKE))
