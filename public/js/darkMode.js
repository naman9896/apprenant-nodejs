var icon = document.getElementById("icon");
icon.onclick = function () {
  document.body.classList.toggle("dark-theme");
  if (document.body.classList.contains("dark-theme")) {
    document.getElementById("icon").checked = true;
  } else {
    document.getElementById("icon").checked = false;
  }
};
