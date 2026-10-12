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
kamera.location = (0, 12, 2.76)
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
    return round(512 - (wz - 2.76) * PX)  # Kamera-Mitte

# ---------- Materialien ----------
def material(name, farbe, rauheit=0.85):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*farbe, 1)
    p.inputs['Roughness'].default_value = rauheit
    return m

def leuchte(name, farbe, kraft):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    pr = m.node_tree.nodes['Principled BSDF']
    pr.inputs['Base Color'].default_value = (*farbe, 1)
    pr.inputs['Emission Color'].default_value = (*farbe, 1)
    pr.inputs['Emission Strength'].default_value = kraft
    return m

SCHWARZ = material('schwarz', (0.045, 0.045, 0.055))
KOHLE = material('kohle', (0.10, 0.10, 0.12))
GRAU = material('grau', (0.18, 0.18, 0.20))
WEINROT = material('weinrot', (0.30, 0.06, 0.10))
ROTGLUT = leuchte('rotglut', (0.9, 0.08, 0.08), 3.5)

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
        kugel(0, 0.38, 0.3, SCHWARZ, sx=0.95, sz=1.1)        # Kapuze
        kugel(0.2, 0.52, 0.18, SCHWARZ, sx=1.3, sz=0.8)      # Kapuzen-Falte hinten
        kugel(-0.11, 0.24, 0.2, KOHLE, sx=0.95, sz=0.72)     # Gesichtsmaske
        quader(-0.25, 0.4, 0.08, 0.18, 0.03, ROTGLUT)        # glühender Augenschlitz
    return sammle(b)

def baue_torso():
    def b():
        kugel(0, -0.28, 0.5, SCHWARZ, sy=0.55, sz=0.8)        # Brust
        quader(-0.34, -0.5, 0.12, 0.26, 0.3, KOHLE)           # Brustplatte vorn
        stumpf(0, -0.75, 0.38, -1.42, 0.3, SCHWARZ, sy=0.55)  # Taille
        zylinder(0, -1.46, 0.36, 0.14, GRAU, sy=0.6)          # Gürtel
        quader(-0.26, -1.6, 0.12, 0.18, 0.1, KOHLE)           # Tasche vorn
        quader(0.26, -1.6, 0.12, 0.18, 0.1, KOHLE)            # Tasche hinten
        stumpf(0, -1.52, 0.36, -2.15, 0.44, KOHLE, sy=0.5)    # Rock-Schöße
        kugel(0, 0.04, 0.33, WEINROT, sx=1.3, sy=0.85, sz=0.45)  # Schal
        kugel(0.5, -0.35, 0.1, WEINROT, sx=2.4, sz=0.5)       # Schal-Ende weht
        kugel(0.56, -0.8, 0.09, WEINROT, sx=2.0, sz=0.45)
    return sammle(b)

def baue_oberarm():
    def b():
        kugel(0, -0.06, 0.26, KOHLE, sz=0.8)                  # Schulterplatte
        quader(-0.17, -0.1, 0.07, 0.18, 0.09, ROTGLUT)        # rote Markierung
        stumpf(0, -0.14, 0.2, -0.9, 0.13, SCHWARZ)
        zylinder(0, -0.88, 0.16, 0.12, KOHLE)
    return sammle(b)

def baue_unterarm():
    def b():
        stumpf(0, -0.02, 0.15, -0.66, 0.11, SCHWARZ)
        stumpf(0, -0.32, 0.17, -0.66, 0.13, KOHLE)            # Armschiene
        kugel(0, -0.8, 0.15, KOHLE, sz=1.1)                   # Handschuh-Faust
        kugel(-0.11, -0.74, 0.065, KOHLE)
    return sammle(b)

def baue_schenkel():
    def b():
        kugel(0, -0.05, 0.26, SCHWARZ, sz=0.8)
        stumpf(0, -0.1, 0.24, -1.4, 0.15, SCHWARZ)
        zylinder(0, -1.38, 0.18, 0.12, KOHLE)
    return sammle(b)

def baue_schienbein():
    def b():
        stumpf(0, -0.02, 0.14, -0.6, 0.12, SCHWARZ)
        for i, zz in enumerate([-0.6, -0.78, -0.96, -1.14]):   # Bandagen
            zylinder(0, zz, 0.15 - i * 0.007, 0.15, GRAU)
        kugel(-0.15, -1.4, 0.16, SCHWARZ, sx=1.5, sz=0.55)     # Tabi-Spitze
        kugel(0.09, -1.41, 0.11, SCHWARZ, sx=0.9, sz=0.6)      # Ferse
    return sammle(b)

# ---------- Figur montieren (Spreiz-Pose; vorwärts = Welt -X = Bild rechts) ----------
def grad(w):
    return math.radians(w)

SCHULTER = (0.3, 4.4)
HUEFTE = (0.3, 2.9)
HALS = (0.3, 4.52)
L_OBERARM, L_UNTERARM, L_SCHENKEL, L_SCHIENBEIN = 0.95, 0.85, 1.5, 1.45

def kind(gelenk, winkel, laenge):
    return (gelenk[0] - math.sin(grad(winkel)) * laenge, gelenk[1] - math.cos(grad(winkel)) * laenge)

ELLE = kind(SCHULTER, 50, L_OBERARM)
HAND = kind(ELLE, 75, L_UNTERARM)  # Ellbogen leicht gebeugt — natürliche Haltung
KNIE_V = kind(HUEFTE, 24, L_SCHENKEL)
FUSS_V = kind(KNIE_V, 28, L_SCHIENBEIN)
KNIE_H = kind(HUEFTE, -24, L_SCHENKEL)
FUSS_H = kind(KNIE_H, -28, L_SCHIENBEIN)
SCHEITEL = (HALS[0], HALS[1] + 0.75)

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
teile['armO'] = baue_oberarm();       platziere(teile['armO'], SCHULTER, 50)
teile['armU'] = baue_unterarm();      platziere(teile['armU'], ELLE, 75)

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
