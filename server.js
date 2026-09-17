const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));

const studentSchema = new mongoose.Schema(
    {
        subject: {
    type: String,
    required: true,
    trim: true
},
        studentId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        grade: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const teacherSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Student = mongoose.model("Student", studentSchema);
const Teacher = mongoose.model("Teacher", teacherSchema);

function createToken(teacher) {
    return jwt.sign(
        {
            id: teacher._id.toString(),
            role: "teacher"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
}

function verifyTeacher(req, res, next) {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required."
        });
    }

    const token = authorization.substring(7);

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "teacher") {
            return res.status(403).json({
                message: "Teacher access required."
            });
        }

        req.teacher = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
}

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});

app.post("/api/teacher/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const teacher = await Teacher.findOne({
            email: email.toLowerCase().trim()
        });

        if (!teacher) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            teacher.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = createToken(teacher);

        return res.json({
            message: "Login successful.",
            token
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Server error."
        });
    }
});

async function createTeacherAccount() {
    try {
        const email = process.env.TEACHER_EMAIL;
        const password = process.env.TEACHER_PASSWORD;

        if (!email || !password) {
            console.log(
                "Teacher credentials are missing in .env."
            );
            return;
        }

        const normalizedEmail = email
            .toLowerCase()
            .trim();

        const existingTeacher = await Teacher.findOne({
            email: normalizedEmail
        });

        if (existingTeacher) {
            console.log(
                "Teacher account already exists."
            );
            return;
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        await Teacher.create({
            email: normalizedEmail,
            password: hashedPassword
        });

        console.log(
            "Teacher account created successfully."
        );
    } catch (error) {
        console.error(
            "Teacher account creation failed:",
            error.message
        );
    }
}
app.put(
    "/api/teacher/change-password",
    verifyTeacher,
    async (req, res) => {
        try {
            const {
                currentPassword,
                newPassword,
                confirmPassword
            } = req.body;

            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword
            ) {
                return res.status(400).json({
                    message:
                        "All password fields are required."
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    message:
                        "New password must be at least 6 characters."
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    message:
                        "New passwords do not match."
                });
            }

            const teacher =
                await Teacher.findById(req.teacher.id);

            if (!teacher) {
                return res.status(404).json({
                    message: "Teacher not found."
                });
            }

            const passwordMatch =
                await bcrypt.compare(
                    currentPassword,
                    teacher.password
                );

            if (!passwordMatch) {
                return res.status(401).json({
                    message:
                        "Current password is incorrect."
                });
            }

            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    10
                );

            teacher.password = hashedPassword;

            await teacher.save();

            return res.json({
                message:
                    "Password changed successfully."
            });
        } catch (error) {
            console.error(
                "Change password error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to change password."
            });
        }
    }
);
app.get(
    "/api/students",
    verifyTeacher,
    async (req, res) => {
        try {
            const students = await Student.find()
                .sort({ createdAt: -1 });

            return res.json(students);
        } catch (error) {
            console.error(
                "Load students error:",
                error
            );

            return res.status(500).json({
                message: "Unable to load students."
            });
        }
    }
);

app.post(
    "/api/students",
    verifyTeacher,
    async (req, res) => {
        try {
            const {
    studentId,
    name,
    grade,
    subject,
    phone
} = req.body;

           if (
    !studentId ||
    !name ||
    !grade ||
    !subject ||
    !phone
) {
    return res.status(400).json({
        message: "All fields are required."
    });
}

            const normalizedStudentId =
                studentId.trim();

            const existingStudent =
                await Student.findOne({
                    studentId: normalizedStudentId
                });

            if (existingStudent) {
                return res.status(409).json({
                    message:
                        "Student ID already exists."
                });
            }

            const student = await Student.create({
    studentId: normalizedStudentId,
    name: name.trim(),
    grade: grade.trim(),
    subject: subject.trim(),
    phone: phone.trim()
});
            return res.status(201).json({
                message:
                    "Student registered successfully.",
                student
            });
        } catch (error) {
            console.error(
                "Register student error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to register student."
            });
        }
    }
);

app.put(
    "/api/students/:id",
    verifyTeacher,
    async (req, res) => {
        try {
            const {
                name,
                grade,
                phone
            } = req.body;

            if (!name || !grade || !phone) {
                return res.status(400).json({
                    message:
                        "All fields are required."
                });
            }

            const student =
                await Student.findByIdAndUpdate(
                    req.params.id,
                    {
                        name: name.trim(),
                        grade: grade.trim(),
                        phone: phone.trim()
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!student) {
                return res.status(404).json({
                    message: "Student not found."
                });
            }

            return res.json({
                message:
                    "Student updated successfully.",
                student
            });
        } catch (error) {
            console.error(
                "Update student error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to update student."
            });
        }
    }
);

app.delete(
    "/api/students/:id",
    verifyTeacher,
    async (req, res) => {
        try {
            const student =
                await Student.findByIdAndDelete(
                    req.params.id
                );

            if (!student) {
                return res.status(404).json({
                    message: "Student not found."
                });
            }

            return res.json({
                message:
                    "Student deleted successfully."
            });
        } catch (error) {
            console.error(
                "Delete student error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to delete student."
            });
        }
    }
);

async function startServer() {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log(
            "MongoDB connected successfully."
        );

        await createTeacherAccount();

        app.listen(PORT, () => {
            console.log(
                `Teacher Helper is running on port ${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    }
}

startServer();