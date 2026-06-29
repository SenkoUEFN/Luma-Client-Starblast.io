const buttonStart = document.querySelector(".launch-button")

buttonStart.addEventListener("click", () =>
{
    console.log("starting game")
    window.api.startGame()
})