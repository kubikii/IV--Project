const btn = document.getElementById("testButton");
const ausgabe = document.getElementById("ausgabe");

btn.addEventListener("click", () => {
  ausgabe.textContent = "Button funktioniert! 🎉";
});
