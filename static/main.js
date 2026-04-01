// 1. Logika Toggle Mode (Realtime vs Upload)
function toggleMode(mode) {
  const uploadView = document.getElementById("uploadView");
  const cameraView = document.getElementById("cameraView");
  const btnR = document.getElementById("btnRealtime");
  const btnU = document.getElementById("btnUpload");

  if (mode === "realtime") {
    if (cameraView) cameraView.classList.remove("d-none");
    if (uploadView) uploadView.classList.add("d-none");
    btnR.classList.add("active-mode");
    btnU.classList.remove("active-mode");
  } else {
    if (cameraView) cameraView.classList.add("d-none");
    if (uploadView) uploadView.classList.remove("d-none");
    btnU.classList.add("active-mode");
    btnR.classList.remove("active-mode");
  }
}

// 2. Preview Gambar sebelum Analisis
function previewFile() {
  const preview = document.getElementById("imagePreview");
  const container = document.getElementById("imagePreviewContainer");
  const empty = document.getElementById("emptyPreview");
  const file = document.getElementById("fileInput").files[0];
  const reader = new FileReader();

  reader.onloadend = function () {
    preview.src = reader.result;
    container.classList.remove("d-none");
    empty.classList.add("d-none");
  };

  if (file) {
    reader.readAsDataURL(file);
  }
}

// 3. Analisis Gambar Tanpa Reload (AJAX)
async function analyzeImage(event) {
  event.stopPropagation();
  const fileInput = document.getElementById("fileInput");
  const btn = document.getElementById("btnAnalyze");
  const resultArea = document.getElementById("resultArea");

  if (fileInput.files.length === 0) return;

  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
  btn.disabled = true;

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  try {
    const response = await fetch("/predict", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      // Update UI dengan data dari Server
      document.getElementById("resLabel").innerText = data.prediction;
      document.getElementById("resConf").innerText =
        data.confidence + "% Akurat";
      document.getElementById("resDesc").innerText = data.description;

      // UPDATE: Menampilkan data rekomendasi
      const resReco = document.getElementById("resReco");
      if (resReco) {
        resReco.innerText = data.recommendation;
      }

      resultArea.classList.remove("d-none");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Gagal menganalisis gambar. Pastikan server Flask berjalan.");
  } finally {
    btn.innerHTML = '<i class="bi bi-cpu me-2"></i>Mulai Analisis';
    btn.disabled = false;
  }
}

// 4. Fungsi Hapus Gambar
function removeImage(event) {
  event.stopPropagation();
  const fileInput = document.getElementById("fileInput");
  const container = document.getElementById("imagePreviewContainer");
  const empty = document.getElementById("emptyPreview");
  const resultArea = document.getElementById("resultArea");

  fileInput.value = "";
  container.classList.add("d-none");
  empty.classList.remove("d-none");
  resultArea.classList.add("d-none");

  // Reset teks rekomendasi
  const resReco = document.getElementById("resReco");
  if (resReco) resReco.innerText = "";
}

// 5. Navbar active link handling
// 5. Navbar Handling & Smooth Scrolling
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");

    // Jika link mengarah ke ID (diawali dengan #)
    if (targetId.startsWith("#")) {
      e.preventDefault();
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        // Pindah ke section dengan posisi pas di atas
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: "smooth",
        });
      }

      // Hapus kelas 'active' dari semua link, tambahkan ke yang diklik
      document
        .querySelectorAll(".nav-link")
        .forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");

      // Tutup menu navbar otomatis pada tampilan mobile
      const navbarCollapse = document.getElementById("navbarNav");
      if (navbarCollapse && navbarCollapse.classList.contains("show")) {
        const bsCollapse = new bootstrap.Collapse(navbarCollapse);
        bsCollapse.hide();
      }
    }
  });
});

// Otomatis update menu active saat scroll (ScrollSpy)
window.addEventListener("scroll", () => {
  let current = "";
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav-link");

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    // Deteksi jika posisi scroll sudah melewati setengah tinggi section
    if (pageYOffset >= sectionTop - 100) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href").includes(current)) {
      link.classList.add("active");
    }
  });
});

function showTechDesc(name, info) {
  const detailDiv = document.getElementById("techDetail");
  const nameSpan = document.getElementById("techName");
  const infoSpan = document.getElementById("techInfo");

  nameSpan.innerText = name + ":";
  infoSpan.innerText = info;

  detailDiv.classList.remove("d-none");

  // Animasi sedikit agar menarik
  detailDiv.style.opacity = 0;
  setTimeout(() => {
    detailDiv.style.transition = "opacity 0.5s";
    detailDiv.style.opacity = 1;
  }, 10);
}
