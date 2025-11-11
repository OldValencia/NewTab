import os
import zipfile

base_dir = "."

include_dirs = ["fonts", "icons", "scripts", "settings", "styles"]
include_files = ["index.html", "manifest.json"]

zip_name = "New Tab Extension.zip"

if os.path.exists(zip_name):
    try:
        os.remove(zip_name)
        print(f"🗑️ Old archive {zip_name} was deleted.")
    except Exception as e:
        print(f"⚠️ Can't delete old archive {zip_name}: {e}")
        exit(1)

with zipfile.ZipFile(zip_name, "w", zipfile.ZIP_DEFLATED) as zipf:
    for folder in include_dirs:
        folder_path = os.path.join(base_dir, folder)
        if os.path.exists(folder_path):
            for root, _, files in os.walk(folder_path):
                for file in files:
                    abs_path = os.path.join(root, file)
                    rel_path = os.path.relpath(abs_path, base_dir)
                    zipf.write(abs_path, rel_path)

    for file in include_files:
        file_path = os.path.join(base_dir, file)
        if os.path.exists(file_path):
            zipf.write(file_path, file)

print(f"✅ Release archive {zip_name} done.")
