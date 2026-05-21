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
   5. XỬ LÝ KÉO THẢ AVATAR (DRAG & DROP)
========================= */
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

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
  
  // Thuật toán: Chia quãng đường kéo cho currentTemplateScale để tốc độ kéo đồng bộ với vị trí chuột dù ảnh bị thu nhỏ
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

// Chuột trên Máy tính
avatarBox.addEventListener("mousedown", (e) => handleDragStart(e.clientX, e.clientY));
window.addEventListener("mousemove", (e) => handleDragMove(e.clientX, e.clientY));
window.addEventListener("mouseup", handleDragEnd);

// Cảm ứng trên Điện thoại
avatarBox.addEventListener("touchstart", (e) => {
  if (e.touches.length > 0) handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

window.addEventListener("touchmove", (e) => {
  if (!isDragging) return;
  // Ngăn cuộn trang khi đang kéo ảnh
  e.preventDefault();
  handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

window.addEventListener("touchend", handleDragEnd);

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