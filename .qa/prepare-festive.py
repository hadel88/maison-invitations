from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
items=json.loads((root/'.qa/festive-assets.json').read_text())
sheet=Image.new('RGB',(500,3*415),'#f4f0e7');g=ImageDraw.Draw(sheet)
for i,item in enumerate(items):
    source=Image.open(item['path']).convert('RGB')
    source.save(root/'public'/(item['name']+'.webp'),quality=88,method=6)
    if item['family']!='inside':
        thumb=source.copy();thumb.thumbnail((600,1066));thumb.save(root/'public'/(item['name']+'-sm.webp'),quality=82,method=6)
    tile=ImageOps.contain(source,(238,375));x=(i%2)*250+(250-tile.width)//2;y=(i//2)*415
    sheet.paste(tile,(x,y));g.text(((i%2)*250+10,y+382),item['family']+' / '+item['key'],fill='#25372a')
sheet.save(root/'.qa/festive-contactsheet.jpg',quality=90)
print('Saved 6 original artworks, 6 cover thumbnails and contact sheet')
