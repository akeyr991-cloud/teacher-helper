document.addEventListener("DOMContentLoaded", () => {
    initializeMobileMenu();
    initializeLogin();
    initializeLogout();
    initializeStudentRegistration();
    initializeDashboard();
    initializeChangePassword();
});

function initializeMobileMenu() {
    const menuButton =
        document.getElementById("menuButton");

    const mobileMenu =
        document.getElementById("mobileMenu");

    if (!menuButton || !mobileMenu) {
        return;
    }

    menuButton.addEventListener("click", () => {
        mobileMenu.classList.toggle("active");
    });

    const links =
        mobileMenu.querySelectorAll("a");

    links.forEach((link) => {
        link.addEventListener("click", () => {
            mobileMenu.classList.remove("active");
        });
    });
}

function initializeLogin() {
    const form =
        document.getElementById(
            "teacherLoginForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const email =
                document.getElementById(
                    "email"
                ).value.trim();

            const password =
                document.getElementById(
                    "password"
                ).value;

            const message =
                document.getElementById(
                    "loginMessage"
                );

            try {
                const response =
                    await fetch(
                        "/api/teacher/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email,
                                password
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    showMessage(
                        message,
                        data.message ||
                            "Login failed.",
                        "error"
                    );

                    return;
                }

                localStorage.setItem(
                    "teacherToken",
                    data.token
                );

                showMessage(
                    message,
                    "Login successful.",
                    "success"
                );

                setTimeout(() => {
                    window.location.href =
                        "teacher-dashboard.html";
                }, 500);

            } catch (error) {
                console.error(
                    "Login error:",
                    error
                );

                showMessage(
                    message,
                    "Unable to connect to the server.",
                    "error"
                );
            }
        }
    );
}

function initializeLogout() {
    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener(
        "click",
        () => {
            logout();
        }
    );
}

function initializeStudentRegistration() {
    const form =
        document.getElementById(
            "studentForm"
        );

    if (!form) {
        return;
    }

    const token = getToken();

    if (!token) {
        window.location.href =
            "teacher-login.html";

        return;
    }

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const studentId =
                document.getElementById(
                    "studentId"
                ).value.trim();

            const name =
                document.getElementById(
                    "studentName"
                ).value.trim();

            const grade =
                document.getElementById(
                    "grade"
                ).value;

            const subject =
                document.getElementById(
                    "subject"
                ).value;

            const phone =
                document.getElementById(
                    "phone"
                ).value.trim();

            const message =
                document.getElementById(
                    "studentMessage"
                );

            if (
                !studentId ||
                !name ||
                !grade ||
                !subject ||
                !phone
            ) {
                showMessage(
                    message,
                    "All fields are required.",
                    "error"
                );

                return;
            }

            try {
                const response =
                    await fetch(
                        "/api/students",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({
                                studentId,
                                name,
                                grade,
                                subject,
                                phone
                            })
                        }
                    );

                const data =
                    await response.json();

                if (response.status === 401) {
                    logout();
                    return;
                }

                if (!response.ok) {
                    showMessage(
                        message,
                        data.message ||
                            "Unable to register student.",
                        "error"
                    );

                    return;
                }

                showMessage(
                    message,
                    data.message ||
                        "Student registered successfully.",
                    "success"
                );

                form.reset();

            } catch (error) {
                console.error(
                    "Student registration error:",
                    error
                );

                showMessage(
                    message,
                    "Unable to connect to the server.",
                    "error"
                );
            }
        }
    );
}

function initializeDashboard() {
    const tableBody =
        document.getElementById(
            "studentTableBody"
        );

    if (!tableBody) {
        return;
    }

    if (!getToken()) {
        window.location.href =
            "teacher-login.html";

        return;
    }

    loadStudents();

    const searchInput =
        document.getElementById(
            "studentSearch"
        );

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            () => {
                filterStudents(
                    searchInput.value
                );
            }
        );
    }
}

let allStudents = [];

async function loadStudents() {
    const tableBody =
        document.getElementById(
            "studentTableBody"
        );

    const emptyMessage =
        document.getElementById(
            "emptyStudents"
        );

    if (!tableBody) {
        return;
    }

    try {
        const response =
            await fetch(
                "/api/students",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${getToken()}`
                    }
                }
            );

        const data =
            await response.json();

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            showMessage(
                emptyMessage,
                data.message ||
                    "Unable to load students.",
                "error"
            );

            return;
        }

        allStudents = Array.isArray(data)
            ? data
            : [];

        renderStudents(allStudents);

        updateStatistics(
            allStudents
        );

    } catch (error) {
        console.error(
            "Load students error:",
            error
        );

        if (emptyMessage) {
            showMessage(
                emptyMessage,
                "Unable to connect to the server.",
                "error"
            );
        }
    }
}

function renderStudents(students) {
    const tableBody =
        document.getElementById(
            "studentTableBody"
        );

    const emptyMessage =
        document.getElementById(
            "emptyStudents"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!students.length) {
        if (emptyMessage) {
            emptyMessage.style.display =
                "block";
        }

        return;
    }

    if (emptyMessage) {
        emptyMessage.style.display =
            "none";
    }

    students.forEach((student) => {
        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                ${escapeHTML(
                    student.studentId || ""
                )}
            </td>

            <td>
                ${escapeHTML(
                    student.name || ""
                )}
            </td>

            <td>
                ${escapeHTML(
                    student.grade || ""
                )}
            </td>

            <td>
                ${escapeHTML(
                    student.subject || "Not assigned"
                )}
            </td>

            <td>
                ${escapeHTML(
                    student.phone || ""
                )}
            </td>

            <td>
                <div class="action-buttons">

                    <button
                        type="button"
                        class="edit-button"
                        onclick="editStudent('${student._id}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-button"
                        onclick="deleteStudent('${student._id}')"
                    >
                        Delete
                    </button>

                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function filterStudents(searchValue) {
    const value =
        searchValue
            .trim()
            .toLowerCase();

    if (!value) {
        renderStudents(allStudents);
        return;
    }

    const filteredStudents =
        allStudents.filter(
            (student) => {
                return (
                    String(
                        student.studentId || ""
                    )
                        .toLowerCase()
                        .includes(value) ||

                    String(
                        student.name || ""
                    )
                        .toLowerCase()
                        .includes(value) ||

                    String(
                        student.grade || ""
                    )
                        .toLowerCase()
                        .includes(value) ||

                    String(
                        student.subject || ""
                    )
                        .toLowerCase()
                        .includes(value) ||

                    String(
                        student.phone || ""
                    )
                        .toLowerCase()
                        .includes(value)
                );
            }
        );

    renderStudents(
        filteredStudents
    );
}

async function editStudent(studentId) {
    const student =
        allStudents.find(
            (item) =>
                item._id === studentId
        );

    if (!student) {
        alert("Student not found.");
        return;
    }

    const newName =
        prompt(
            "Enter student name:",
            student.name || ""
        );

    if (newName === null) {
        return;
    }

    const newGrade =
        prompt(
            "Enter grade:",
            student.grade || ""
        );

    if (newGrade === null) {
        return;
    }

    const newSubject =
        prompt(
            "Enter subject:",
            student.subject || ""
        );

    if (newSubject === null) {
        return;
    }

    const newPhone =
        prompt(
            "Enter phone number:",
            student.phone || ""
        );

    if (newPhone === null) {
        return;
    }

    const name =
        newName.trim();

    const grade =
        newGrade.trim();

    const subject =
        newSubject.trim();

    const phone =
        newPhone.trim();

    if (
        !name ||
        !grade ||
        !subject ||
        !phone
    ) {
        alert(
            "All fields are required."
        );

        return;
    }

    try {
        const response =
            await fetch(
                `/api/students/${studentId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${getToken()}`
                    },

                    body: JSON.stringify({
                        name,
                        grade,
                        subject,
                        phone
                    })
                }
            );

        const data =
            await response.json();

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            alert(
                data.message ||
                    "Unable to update student."
            );

            return;
        }

        await loadStudents();

        alert(
            data.message ||
                "Student updated successfully."
        );

    } catch (error) {
        console.error(
            "Update student error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );
    }
}

async function deleteStudent(studentId) {
    const student =
        allStudents.find(
            (item) =>
                item._id === studentId
        );

    if (!student) {
        alert("Student not found.");
        return;
    }

    const confirmed =
        confirm(
            `Are you sure you want to delete ${student.name}?`
        );

    if (!confirmed) {
        return;
    }

    try {
        const response =
            await fetch(
                `/api/students/${studentId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${getToken()}`
                    }
                }
            );

        const data =
            await response.json();

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            alert(
                data.message ||
                    "Unable to delete student."
            );

            return;
        }

        await loadStudents();

        alert(
            data.message ||
                "Student deleted successfully."
        );

    } catch (error) {
        console.error(
            "Delete student error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );
    }
}

function updateStatistics(students) {
    const totalStudents =
        document.getElementById(
            "totalStudents"
        );

    const activeStudents =
        document.getElementById(
            "activeStudents"
        );

    if (totalStudents) {
        totalStudents.textContent =
            students.length;
    }

    if (activeStudents) {
        activeStudents.textContent =
            students.length;
    }
}

function initializeChangePassword() {
    const form =
        document.getElementById(
            "changePasswordForm"
        );

    if (!form) {
        return;
    }

    if (!getToken()) {
        window.location.href =
            "teacher-login.html";

        return;
    }

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const currentPassword =
                document.getElementById(
                    "currentPassword"
                ).value;

            const newPassword =
                document.getElementById(
                    "newPassword"
                ).value;

            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;

            const message =
                document.getElementById(
                    "passwordMessage"
                );

            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword
            ) {
                showMessage(
                    message,
                    "All password fields are required.",
                    "error"
                );

                return;
            }

            if (newPassword.length < 6) {
                showMessage(
                    message,
                    "New password must be at least 6 characters.",
                    "error"
                );

                return;
            }

            if (
                newPassword !==
                confirmPassword
            ) {
                showMessage(
                    message,
                    "New passwords do not match.",
                    "error"
                );

                return;
            }

            try {
                const response =
                    await fetch(
                        "/api/teacher/change-password",
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${getToken()}`
                            },

                            body: JSON.stringify({
                                currentPassword,
                                newPassword,
                                confirmPassword
                            })
                        }
                    );

                const data =
                    await response.json();

                if (response.status === 401) {
                    logout();
                    return;
                }

                if (!response.ok) {
                    showMessage(
                        message,
                        data.message ||
                            "Unable to change password.",
                        "error"
                    );

                    return;
                }

                showMessage(
                    message,
                    data.message ||
                        "Password changed successfully.",
                    "success"
                );

                form.reset();

                setTimeout(() => {
                    window.location.href =
                        "teacher-dashboard.html";
                }, 1000);

            } catch (error) {
                console.error(
                    "Change password error:",
                    error
                );

                showMessage(
                    message,
                    "Unable to connect to the server.",
                    "error"
                );
            }
        }
    );
}

function getToken() {
    return localStorage.getItem(
        "teacherToken"
    );
}

function logout() {
    localStorage.removeItem(
        "teacherToken"
    );

    window.location.href =
        "teacher-login.html";
}

function showMessage(
    element,
    text,
    type
) {
    if (!element) {
        return;
    }

    element.textContent =
        text || "";

    element.className =
        `message ${type || ""}`;
}

function escapeHTML(value) {
    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}