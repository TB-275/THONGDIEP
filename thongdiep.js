const avatarInput = document.getElementById("avatarInput");
const nameInput = document.getElementById("nameInput");
const unitInput = document.getElementById("unitInput");
const messageInput = document.getElementById("messageInput");

const avatarPreview = document.getElementById("avatarPreview");
const namePreview = document.getElementById("namePreview");
const unitPreview = document.getElementById("unitPreview");
const messagePreview = document.getElementById("messagePreview");

const downloadBtn = document.getElementById("downloadBtn");
const previewCard = document.getElementById("previewCard");
const previewWrapper = document.getElementById("previewWrapper");
const avatarBox = document.getElementById("avatarBox");

// Biến toàn cục quản lý Scale
let currentTemplateScale = 1; // Tỷ lệ thu nhỏ của toàn bộ thẻ trên màn hình
let avatarScale = 1;          // Tỷ lệ phóng to/thu nhỏ của riêng ảnh đại diện
let currentX = 0;             // Tọa độ X của ảnh đại diện
let currentY = 0;             // Tọa độ Y của ảnh đại diện

/* =========================
   1. CẬP NHẬT VĂN BẢN (REAL-TIME)
========================= */
nameInput.addEventListener("input", () => {
  namePreview.innerText = nameInput.value || "Họ và tên";
});

unitInput.addEventListener("input", () => {
  unitPreview.innerText = unitInput.value || "Đơn vị";
});

messageInput.addEventListener("input", () => {
  messagePreview.innerText = messageInput.value || "CHÚC ĐẠI HỘI THÀNH CÔNG TỐT ĐẸP!";
  autoResizeMessage();
});

// Chạy khởi tạo text mặc định
nameInput.dispatchEvent(new Event("input"));
unitInput.dispatchEvent(new Event("input"));
messageInput.dispatchEvent(new Event("input"));

/* =========================
   2. XỬ LÝ AUTO FIT TEMPLATE
========================= */
// Hàm này giúp Card (1600x900) co giãn vừa khít với màn hình hiện tại mà không làm vỡ layout
function fitTemplate() {
  const containerWidth = previewWrapper.parentElement.clientWidth;
  
  // Tính toán tỷ lệ thu nhỏ để vừa không gian
  currentTemplateScale = Math.min(containerWidth / 1600, 1);
  
  // Áp dụng scale cho khung previewCard
  previewCard.style.transform = `scale(${currentTemplateScale})`;
  
  // Cập nhật lại width/height cho wrapper để không bị dư khoảng trống
  previewWrapper.style.width = `${1600 * currentTemplateScale}px`;
  previewWrapper.style.height = `${900 * currentTemplateScale}px`;
}

window.addEventListener("resize", fitTemplate);
// Chạy ngay khi load trang
fitTemplate();

/* =========================
   3. XỬ LÝ AUTO RESIZE THÔNG ĐIỆP
========================= */
function autoResizeMessage() {
  let fontSize = 58;
  messagePreview.style.fontSize = fontSize + "px";

  // Giảm font-size dần cho đến khi text không bị tràn ra ngoài khung
  while (messagePreview.scrollHeight > messagePreview.clientHeight && fontSize > 14) {
    fontSize--;
    messagePreview.style.fontSize = fontSize + "px";
  }
}

/* =========================
   4. TẢI ẢNH ĐẠI DIỆN VÀ TÍNH TỶ LỆ
========================= */
avatarInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    avatarPreview.onload = function() {
      // Reset tọa độ
      currentX = 0;
      currentY = 0;

      const boxWidth = avatarBox.offsetWidth;
      const boxHeight = avatarBox.offsetHeight;
      const imgWidth = avatarPreview.naturalWidth;
      const imgHeight = avatarPreview.naturalHeight;

      // Fit ảnh: lấy tỷ lệ lớn nhất để bao trùm kín hình tròn (cover)
      const scaleX = boxWidth / imgWidth;
      const scaleY = boxHeight / imgHeight;
      avatarScale = Math.max(scaleX, scaleY);

      updateAvatarTransform();
    };
    avatarPreview.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

/* =========================
   5. XỬ LÝ KÉO THẢ VÀ ZOOM AVATAR (DRAG & ZOOM)
========================= */
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Biến hỗ trợ chạm 2 ngón tay (Pinch-to-zoom)
let initialPinchDistance = null;
let initialAvatarScale = 1;

function updateAvatarTransform() {
  avatarPreview.style.transform = `translate(${currentX}px, ${currentY}px) scale(${avatarScale})`;
}

function handleDragStart(clientX, clientY) {
  isDragging = true;
  lastMouseX = clientX;
  lastMouseY = clientY;
}

function handleDragMove(clientX, clientY) {
  if (!isDragging) return;
  
  // Thuật toán: Chia quãng đường kéo cho currentTemplateScale để tốc độ kéo đồng bộ
  const deltaX = (clientX - lastMouseX) / currentTemplateScale;
  const deltaY = (clientY - lastMouseY) / currentTemplateScale;

  currentX += deltaX;
  currentY += deltaY;

  lastMouseX = clientX;
  lastMouseY = clientY;

  updateAvatarTransform();
}

function handleDragEnd() {
  isDragging = false;
}

// ----------------------------------------
// A. THAO TÁC TRÊN MÁY TÍNH (CHUỘT)
// ----------------------------------------
avatarBox.addEventListener("mousedown", (e) => handleDragStart(e.clientX, e.clientY));
window.addEventListener("mousemove", (e) => handleDragMove(e.clientX, e.clientY));
window.addEventListener("mouseup", handleDragEnd);

// Phóng to/ Thu nhỏ bằng con lăn chuột
avatarBox.addEventListener("wheel", (e) => {
  e.preventDefault(); // Ngăn cuộn trang web
  const zoomStep = 0.05; // Tốc độ zoom mỗi lần lăn
  
  if (e.deltaY < 0) {
    avatarScale += zoomStep; // Lăn lên -> Phóng to
  } else {
    avatarScale = Math.max(0.1, avatarScale - zoomStep); // Lăn xuống -> Thu nhỏ (tối thiểu 0.1)
  }
  updateAvatarTransform();
}, { passive: false });

// ----------------------------------------
// B. THAO TÁC TRÊN ĐIỆN THOẠI (CẢM ỨNG)
// ----------------------------------------
avatarBox.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    // Chạm 1 ngón -> Kéo thả
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  } else if (e.touches.length === 2) {
    // Chạm 2 ngón -> Bắt đầu tính toán Zoom
    isDragging = false; // Hủy trạng thái kéo thả
    initialPinchDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    initialAvatarScale = avatarScale;
  }
}, { passive: false });

window.addEventListener("touchmove", (e) => {
  if (e.touches.length === 1 && isDragging) {
    // Di chuyển 1 ngón
    e.preventDefault();
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  } else if (e.touches.length === 2 && initialPinchDistance) {
    // Di chuyển 2 ngón tay -> Thực hiện Zoom
    e.preventDefault();
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    
    const scaleFactor = currentDistance / initialPinchDistance;
    avatarScale = Math.max(0.1, initialAvatarScale * scaleFactor); // Giới hạn không cho zoom quá nhỏ
    updateAvatarTransform();
  }
}, { passive: false });

window.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) {
    initialPinchDistance = null; // Thả 1 trong 2 ngón tay ra thì dừng zoom
  }
  if (e.touches.length === 0) {
    handleDragEnd(); // Thả hết tay ra thì dừng kéo
  }
});
/* =========================
   6. TẢI ẢNH (HTML2CANVAS)
========================= */
downloadBtn.addEventListener("click", async () => {
  downloadBtn.innerText = "Đang xuất ảnh...";
  downloadBtn.disabled = true;

  try {
    // 1. Tạm thời phục hồi Scale về 1 để chụp đúng độ phân giải 1600x900
    previewCard.style.transform = "scale(1)";
    
    // Đợi layout cập nhật
    await new Promise(resolve => setTimeout(resolve, 100));

    // 2. Tiến hành chụp ảnh
    const canvas = await html2canvas(previewCard, {
      useCORS: true,
      scale: 3, // Scale = 2 để ảnh xuất ra sắc nét hơn (retina - tương đương 3200x1800)
      width: 1600,
      height: 900,
      logging: false
    });

    // 3. Phục hồi lại mức Scale hiển thị trên thiết bị
    fitTemplate();

    // 4. Tạo file tải xuống
    const link = document.createElement("a");
    link.download = "thong-diep-dai-hoi.png";
    link.href = canvas.toDataURL("image/png");
    link.click();

  } catch (error) {
    console.error(error);
    alert("Có lỗi khi xuất ảnh. Vui lòng thử lại!");
    // Phục hồi giao diện nếu lỗi
    fitTemplate();
  }

  downloadBtn.innerText = "Tải ảnh xuống";
  downloadBtn.disabled = false;
});