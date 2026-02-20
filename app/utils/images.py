from io import BytesIO

from django.core.files import File
from django.db.models.fields.files import ImageFieldFile

from PIL.Image import open as open_image, Image

def save_as_thumbnail(original: ImageFieldFile, thumbnail_size: int | None = None) -> File:
    image: Image = open_image(original)
    image = image.convert("RGB")

    if thumbnail_size is not None:
        image = make_thumbnail_from_image(image, thumbnail_size)

    image_bytes = BytesIO()
    image.save(image_bytes, 'JPEG', quality=70)
    return File(image_bytes, name=original.name)

def make_thumbnail_from_image(image: Image, size: int) -> Image:
    smaller_side = min(image.width, image.height)
    ratio = 1 / (smaller_side / size)
    new_thumbnail_size = (int(image.width * ratio), int(image.height * ratio))
    image.thumbnail(new_thumbnail_size)

    x = 0
    y = 0

    if image.width > size:
        x = (image.width - size) / 2
    else:
        x = (size - image.width) / 2

    if image.height > size:
        y = (image.height - size) / 2
    else:
        y = (size - image.height) / 2

    return image.crop((x, y, image.width - x, image.height - y))