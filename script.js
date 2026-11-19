
const defaultCourses = [
    {
        id: 1,
        name: "Python Programming",
        description: "Learn Python, programming fundamentals and problem solving.",
        duration: "3 Months"
    },
    {
        id: 2,
        name: "Data Structures",
        description: "Learn arrays, linked lists, stacks, queues and trees.",
        duration: "4 Months"
    },
    {
        id: 3,
        name: "Cloud Computing",
        description: "Explore AWS, cloud infrastructure and deployment.",
        duration: "3 Months"
    },
    {
        id: 4,
        name: "Machine Learning",
        description: "Understand AI, algorithms and predictive models.",
        duration: "4 Months"
    },
    {
        id: 5,
        name: "Web Development",
        description: "Build websites using HTML, CSS and JavaScript.",
        duration: "3 Months"
    },
    {
        id: 6,
        name: "Cyber Security",
        description: "Learn network security and ethical hacking fundamentals.",
        duration: "4 Months"
    }
];

let courses = JSON.parse(localStorage.getItem("courses")) || defaultCourses;
let users = JSON.parse(localStorage.getItem("users")) || [];
let registrations = JSON.parse(localStorage.getItem("registrations")) || [];
let currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || null;

function saveData() {
    localStorage.setItem("courses", JSON.stringify(courses));
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("registrations", JSON.stringify(registrations));
}

function showPage(pageId) {
    if (["mycourses", "admin"].includes(pageId) && !currentUser) {
        alert("Please login first!");
        pageId = "login";
    }

    if (pageId === "admin" && currentUser?.role !== "admin") {
        alert("Admin access only!");
        pageId = "home";
    }

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

    if (pageId === "courses") renderCourses();
    if (pageId === "mycourses") renderMyCourses();
    if (pageId === "admin") renderAdmin();

    window.scrollTo(0, 0);
    updateNavbar();
}

function updateNavbar() {
    document.getElementById("userName").textContent =
        currentUser ? currentUser.name : "Guest";

    document.getElementById("loginBtn").hidden = !!currentUser;
    document.getElementById("logoutBtn").hidden = !currentUser;

    document.getElementById("adminLink").hidden =
        currentUser?.role !== "admin";
}

// STUDENT REGISTRATION
function registerUser(event) {
    event.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value;

    if (users.some(user => user.email === email)) {
        alert("Email already registered!");
        return;
    }

    users.push({
        name,
        email,
        password,
        role: "student"
    });

    saveData();

    alert("Account created successfully!");
    event.target.reset();
    showPage("login");
}

// LOGIN
function login(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    let user = null;

    if (email === "admin@sruni.edu" && password === "admin123") {
        user = {
            name: "Administrator",
            email,
            role: "admin"
        };
    } else {
        user = users.find(u =>
            u.email === email && u.password === password
        );
    }

    if (!user) {
        alert("Invalid email or password!");
        return;
    }

    currentUser = user;
    sessionStorage.setItem("currentUser", JSON.stringify(user));

    alert("Login successful!");

    event.target.reset();
    updateNavbar();
    showPage("home");
}

// LOGOUT
function logout() {
    currentUser = null;
    sessionStorage.removeItem("currentUser");

    alert("Logged out successfully!");
    updateNavbar();
    showPage("home");
}

// DISPLAY COURSES
function renderCourses() {
    const search = document.getElementById("searchInput").value.toLowerCase();

    const filtered = courses.filter(course =>
        course.name.toLowerCase().includes(search)
    );

    document.getElementById("courseCount").textContent = courses.length;

    const list = document.getElementById("courseList");
    list.innerHTML = "";

    if (filtered.length === 0) {
        list.innerHTML = "<p>No courses found.</p>";
        return;
    }

    filtered.forEach(course => {
        const enrolled = currentUser && registrations.some(r =>
            r.email === currentUser.email && r.courseId === course.id
        );

        list.innerHTML += `
            <div class="course-card">
                <div class="course-icon">📚</div>
                <h3>${escapeHTML(course.name)}</h3>
                <p>${escapeHTML(course.description)}</p>
                <p class="duration">Duration: ${escapeHTML(course.duration)}</p>
                <button onclick="enroll(${course.id})"
                    ${enrolled ? "disabled" : ""}>
                    ${enrolled ? "Already Registered" : "Register Now"}
                </button>
            </div>
        `;
    });
}

// REGISTER FOR COURSE
function enroll(courseId) {
    if (!currentUser) {
        alert("Please login before registering!");
        showPage("login");
        return;
    }

    if (currentUser.role !== "student") {
        alert("Only students can register for courses!");
        return;
    }

    const exists = registrations.some(r =>
        r.email === currentUser.email && r.courseId === courseId
    );

    if (exists) {
        alert("You are already registered!");
        return;
    }

    registrations.push({
        email: currentUser.email,
        courseId
    });

    saveData();

    alert("Course registered successfully!");
    renderCourses();
}

// MY REGISTERED COURSES
function renderMyCourses() {
    const list = document.getElementById("myCourseList");
    list.innerHTML = "";

    const myCourses = registrations.filter(r =>
        r.email === currentUser.email
    );

    if (myCourses.length === 0) {
        list.innerHTML = "<p>You have not registered for any courses yet.</p>";
        return;
    }

    myCourses.forEach(registration => {
        const course = courses.find(c => c.id === registration.courseId);

        if (!course) return;

        list.innerHTML += `
            <div class="course-card">
                <div class="course-icon">🎓</div>
                <h3>${escapeHTML(course.name)}</h3>
                <p>${escapeHTML(course.description)}</p>
                <p class="duration">${escapeHTML(course.duration)}</p>
                <button class="delete"
                    onclick="cancelRegistration(${course.id})">
                    Cancel Registration
                </button>
            </div>
        `;
    });
}

// CANCEL REGISTRATION
function cancelRegistration(courseId) {
    if (!confirm("Cancel this course registration?")) return;

    registrations = registrations.filter(r =>
        !(r.email === currentUser.email && r.courseId === courseId)
    );

    saveData();
    renderMyCourses();
}

// ADMIN: ADD OR EDIT COURSE
function saveCourse(event) {
    event.preventDefault();

    const id = document.getElementById("editId").value;

    const course = {
        id: id ? Number(id) : Date.now(),
        name: document.getElementById("courseName").value.trim(),
        description: document.getElementById("courseDescription").value.trim(),
        duration: document.getElementById("courseDuration").value.trim()
    };

    if (id) {
        courses = courses.map(c =>
            c.id === Number(id) ? course : c
        );
        alert("Course updated successfully!");
    } else {
        courses.push(course);
        alert("Course added successfully!");
    }

    saveData();
    resetCourseForm();
    renderAdmin();
}

// ADMIN: DISPLAY COURSES
function renderAdmin() {
    const list = document.getElementById("adminCourseList");
    list.innerHTML = "";

    courses.forEach(course => {
        list.innerHTML += `
            <div class="admin-item">
                <div>
                    <h3>${escapeHTML(course.name)}</h3>
                    <p>${escapeHTML(course.duration)}</p>
                </div>

                <div>
                    <button onclick="editCourse(${course.id})">Edit</button>
                    <button class="delete"
                        onclick="deleteCourse(${course.id})">Delete</button>
                </div>
            </div>
        `;
    });
}

// ADMIN: EDIT COURSE
function editCourse(id) {
    const course = courses.find(c => c.id === id);

    if (!course) return;

    document.getElementById("editId").value = course.id;
    document.getElementById("courseName").value = course.name;
    document.getElementById("courseDescription").value = course.description;
    document.getElementById("courseDuration").value = course.duration;
    document.getElementById("formHeading").textContent = "Edit Course";

    window.scrollTo(0, 0);
}

// ADMIN: DELETE COURSE
function deleteCourse(id) {
    if (!confirm("Are you sure you want to delete this course?")) return;

    courses = courses.filter(c => c.id !== id);
    registrations = registrations.filter(r => r.courseId !== id);

    saveData();
    renderAdmin();
}

// RESET ADMIN FORM
function resetCourseForm() {
    document.querySelector("#admin form").reset();
    document.getElementById("editId").value = "";
    document.getElementById("formHeading").textContent = "Add New Course";
}

// BASIC HTML OUTPUT ESCAPING
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// INITIALIZE WEBSITE
updateNavbar();
document.getElementById("courseCount").textContent = courses.length;
