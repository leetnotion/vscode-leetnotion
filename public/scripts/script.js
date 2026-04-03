const vscode = acquireVsCodeApi();
const setPropertiesSection = document.getElementById("setPropertiesSection");
const setPropertiesButton = document.getElementById("setPropertiesButton");
window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
        case "submission-done":
            setPropertiesButton.onclick = () => {
                const notesInput = document.getElementById("notes-input");
                const reviewDateInput = document.getElementById("review-date-input");
                const optimalCheckboxInput = document.getElementById("optimal-checkbox-input");
                vscode.postMessage({
                    command: "set-properties",
                    questionPageId: message.questionPageId,
                    submissionPageId: message.submissionPageId,
                    notes: notesInput.value,
                    reviewDate: reviewDateInput.value,
                    isOptimal: optimalCheckboxInput.checked,
                    initialTags: message.tags.filter(({ selected }) => selected).map(({ text }) => text),
                    finalTags: $("#tags-select").select2("data").map(({ text }) => text),
                });
            };
            $("#tags-select").select2({
                tags: true,
                dropdownParent: $("#tags-box"),
                tokenSeparators: [","],
                data: message.tags,
                maximumSelectionLength: 100,
                placeholder: "Search for an option...",
            });
            const reviewDateInput = document.getElementById("review-date-input");
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const minDate = tomorrow.toISOString().split("T")[0];
            reviewDateInput.min = minDate;
            reviewDateInput.addEventListener("blur", () => {
                if (reviewDateInput.value && reviewDateInput.value < minDate) {
                    reviewDateInput.value = "";
                    vscode.postMessage({ command: "show-error", message: "Review date must be in the future." });
                }
            });
            setPropertiesSection.style.display = "block";
            $(document).on("click", (e) => {
                if (!$(e.target).closest(".select2-container").length) {
                    $("#tags-select").select2("close");
                    $(".select2-container .select2-search__field").blur();
                }
            });
            break;
    }
});
