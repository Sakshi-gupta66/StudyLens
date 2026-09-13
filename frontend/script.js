const API_URL = "http://127.0.0.1:8000";


// Upload PDF
async function uploadPDF() {

    const fileInput = document.getElementById("pdfFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a PDF first.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const status = document.getElementById("uploadStatus");

    status.innerText = "Uploading PDF...";

    try {

        const response = await fetch(
            `${API_URL}/upload`,
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        status.innerText = data.message;

    } catch (error) {

        status.innerText = "Error connecting to server.";

        console.error(error);
    }
}


// Ask Question
async function askQuestion() {

    const questionInput =
        document.getElementById("question");

    const result =
        document.getElementById("result");

    const question =
        questionInput.value.trim();

    if (!question) {
        alert("Please enter a question.");
        return;
    }

    result.innerText = "Thinking...";

    try {

        const response = await fetch(
            `${API_URL}/ask`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    question: question
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `HTTP error: ${response.status}`
            );
        }

        const data = await response.json();

        result.innerText = data.answer;

    } catch (error) {

        result.innerText =
            "Error connecting to server.";

        console.error(error);
    }
}


// Summary
async function generateSummary() {

    const result = document.getElementById("result");

    result.innerText = "Generating summary...";

    console.log("SUMMARY: button clicked");

    try {

        const response = await fetch(
            `${API_URL}/summary`,
            {
                method: "POST"
            }
        );

        console.log("SUMMARY: response received");
        console.log("SUMMARY: status =", response.status);

        const data = await response.json();

        console.log("SUMMARY: data =", data);
        console.log("SUMMARY: summary =", data.summary);

        result.innerText = "TEST: " + data.summary;

        console.log("SUMMARY: result updated");

    } catch (error) {

        console.error("SUMMARY ERROR:", error);

        result.innerText =
            "Error connecting to server.";
    }
}


// Notes
async function generateNotes() {

    const result =
        document.getElementById("result");

    result.innerText = "Generating notes...";

    try {

        const response = await fetch(
            `${API_URL}/notes`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        result.innerText =
            data.notes || data.message;

    } catch (error) {

        result.innerText =
            "Error connecting to server.";

        console.error(error);
    }
}


// Quiz
async function generateQuiz() {

    const result =
        document.getElementById("result");

    result.innerText = "Generating quiz...";

    try {

        const response = await fetch(
            `${API_URL}/quiz`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        result.innerText =
            data.quiz || data.message;

    } catch (error) {

        result.innerText =
            "Error connecting to server.";

        console.error(error);
    }
}


// Translation
async function translatePDF() {

    const result =
        document.getElementById("result");

    const language =
        prompt("Enter target language:");

    if (!language) {
        return;
    }

    result.innerText =
        "Translating PDF...";

    try {

        const response = await fetch(
            `${API_URL}/translate`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    target_language: language
                })
            }
        );

        const data = await response.json();

        result.innerText =
            data.translation || data.message;

    } catch (error) {

        result.innerText =
            "Error connecting to server.";

        console.error(error);
    }
}