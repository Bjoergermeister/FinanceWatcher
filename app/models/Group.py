from io import BytesIO
from django.core.files import File
from django.db import models

from PIL import Image

class Group(models.Model):
    name = models.CharField(db_column="name")
    user = models.UUIDField(db_column="user", null=True)
    icon = models.ImageField(db_column="icon", null=True, upload_to="groups")

    def preprocess_image(self):
        image = Image.open(self.icon)
        
        smaller_side = min(image.width, image.height)
        ratio = 1 / (smaller_side / 250)
        size = (int(image.width * ratio), int(image.height * ratio))
        image.thumbnail(size)

        x = (image.width - 250) / 2
        y = (image.height - 250) / 2

        image = image.crop((x, y, image.width - x, image.height - y))
        image_bytes = BytesIO()
        image.save(image_bytes, 'JPEG', quality=70)
        self.icon = File(image_bytes, name=self.icon.name)

    def to_dict(self):
        return {
            "name": self.name,
            "user": self.user,
            "image": self.icon.url
        }

    def save(self, *args, **kwargs):
        self.preprocess_image()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "Group"