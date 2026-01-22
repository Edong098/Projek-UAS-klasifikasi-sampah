import os
import cv2 # type: ignore
import numpy as np # type: ignore
import tensorflow as tf # type: ignore
from flask import Flask, render_template, Response, request, jsonify # type: ignore
from PIL import Image # type: ignore
from werkzeug.utils import secure_filename # type: ignore
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input # type: ignore

# CONFIG
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# LOAD MODEL
model = tf.keras.models.load_model("mobilenetv2_clahe_best.h5")

# LABELS & DESCRIPTIONS
class_names = ["organic", "paper", "plastic"] 
descriptions = {
    "plastic": "Sampah plastik sulit terurai dan dapat mencemari tanah serta laut.",
    "paper": "Sampah kertas dapat didaur ulang namun konsumsi berlebihan menyebabkan deforestasi.",
    "organic": "Sampah organik mudah terurai tetapi dapat menimbulkan bau dan penyakit."
}

# Rekomendasi
recommendations = {
    "plastic": "Gunakan kembali sebagai pot tanaman atau kirim ke bank sampah terdekat untuk didaur ulang.",
    "paper": "Pisahkan dari sampah basah agar tetap kering sehingga bisa didaur ulang menjadi kertas baru.",
    "organic": "Olah menjadi kompos untuk nutrisi tanaman atau gunakan metode biopori untuk mengurangi bau."
}

# REALTIME WEBCAM
def gen_frames():
    cap = cv2.VideoCapture(0)
    while True:
        success, frame = cap.read()
        if not success:
            break

        img = cv2.resize(frame, (224, 224))
        img = preprocess_input(img.astype(np.float32))
        img = np.expand_dims(img, axis=0)

        preds = model.predict(img, verbose=0)[0]
        class_id = np.argmax(preds)
        confidence = float(preds[class_id]) * 100

        if confidence > 50:
            label = class_names[class_id]
            color = (0, 255, 0)
        else:
            label = "Unknown"
            color = (0, 0, 255)

        cv2.putText(
            frame,
            f"{label.upper()} ({confidence:.2f}%)",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            color,
            2
        )

        ret, buffer = cv2.imencode(".jpg", frame)
        frame = buffer.tobytes()
        yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")


# ROUTES
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/video_feed")
def video_feed():
    return Response(
        gen_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )

# IMAGE UPLOAD CLASSIFICATION (AJAX)
@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No filename"}), 400

    # Save Image
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    # Load & Preprocess
    img = Image.open(filepath).convert("RGB")
    img_resized = img.resize((224, 224))
    img_array = np.array(img_resized).astype(np.float32)
    img_array = preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)

    # Predict
    preds = model.predict(img_array, verbose=0)[0]
    class_id = np.argmax(preds)
    confidence = round(float(preds[class_id]) * 100, 2)
    
    # Validasi Label
    if confidence > 40: # Jika sangat yakin > 40% baru tampilkan
        label = class_names[class_id]
        desc = descriptions.get(label, "Deskripsi tidak tersedia.")
        reco = recommendations.get(label, "Belum ada rekomendasi khusus.")
    else:
        label = "Tidak Terdeteksi"
        desc = "Model kurang yakin dengan jenis sampah ini."
        reco = "Silahkan, coba ambil foto ulang dengan cahaya yang lebih terang."

    # Mengembalikan JSON termasuk data rekomendasi
    return jsonify({
        "prediction": label.capitalize(),
        "confidence": confidence,
        "description": desc,
        "recommendation": reco,
        "image_path": filepath
    })

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=True)