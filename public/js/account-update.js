const forms = document.querySelectorAll(".updateForm");

forms.forEach(form => {
    const updateBtn = form.querySelector("button");

    form.addEventListener("change", () => {
        updateBtn.removeAttribute("disabled");
    });
});
