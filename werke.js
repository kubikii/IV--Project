(() => {
  const audioInput = document.getElementById("audioFile");
  const audioPlayer = document.getElementById("audioPlayer");
  const audioDownload = document.getElementById("audioDownload");
  const audioHint = document.getElementById("audioHint");

  const videoInput = document.getElementById("videoFile");
  const videoPlayer = document.getElementById("videoPlayer");
  const videoDownload = document.getElementById("videoDownload");
  const videoHint = document.getElementById("videoHint");

  let audioUrl = null;
  let videoUrl = null;

  function setDownload(linkEl, url, filename) {
    linkEl.href = url;
    linkEl.download = filename;
    linkEl.style.display = "inline-block";
  }

  audioInput.addEventListener("change", () => {
    const file = audioInput.files?.[0];
    if (!file) return;

    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = URL.createObjectURL(file);

    audioPlayer.src = audioUrl;
    audioPlayer.load();

    setDownload(audioDownload, audioUrl, file.name || "hoerspiel.mp3");
    audioHint.textContent = `Ausgewählt: ${file.name}`;
  });

  videoInput.addEventListener("change", () => {
    const file = videoInput.files?.[0];
    if (!file) return;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    videoUrl = URL.createObjectURL(file);

    videoPlayer.src = videoUrl;
    videoPlayer.load();

    setDownload(videoDownload, videoUrl, file.name || "video.mp4");
    videoHint.textContent = `Ausgewählt: ${file.name}`;
  });

  // Aufräumen beim Verlassen der Seite
  window.addEventListener("beforeunload", () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  });
})();
