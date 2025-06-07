// בעת טעינת הדף – בדיקה ראשונית
window.addEventListener("DOMContentLoaded", () => {
    // בדיקה האם יש סיסמת ילדים, אם לא – מבקש לקבוע אחת
    if (!localStorage.getItem("childSafetyPassword")) {
        const first = prompt("הגדר סיסמת בטיחות מילדים (לפחות 4 תווים):");
        if (first && first.length >= 4) {
            localStorage.setItem("childSafetyPassword", first);
            alert("סיסמת ילדים נשמרה בהצלחה ✅");
        }
    }

    // בדיקת טביעת אצבע
    const enabled = localStorage.getItem("fingerprintEnabled");
    if (enabled === "true") {
        const useFingerprint = confirm("האם תרצה להתחבר עם טביעת אצבע?");
        if (useFingerprint) {
            tryFingerprintLogin();
        }
    }
});

// 🧠 קבועים
const MAX_LOCAL_ATTEMPTS = 5;

// טופס כניסה עם PIN
document.getElementById("pinForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const userPIN = document.getElementById("pinInput").value;
    const savedPIN = localStorage.getItem("userPIN");
    const locked = localStorage.getItem("childLockEnabled") === "true";
    let attempts = parseInt(localStorage.getItem("localFailedAttempts") || "0");

    if (locked) {
        const unlock = prompt("🔒 נעול. הזן את סיסמת בטיחות מילדים:");
        const childPassword = localStorage.getItem("childSafetyPassword");
        if (unlock === childPassword) {
            alert("✅ נפתח. אפשר לנסות שוב.");
            localStorage.setItem("childLockEnabled", "false");
            localStorage.setItem("localFailedAttempts", "0");
        } else {
            alert("❌ סיסמה שגויה.");
        }
        return;
    }

    if (!savedPIN) {
        // קוד חדש
        localStorage.setItem("userPIN", userPIN);
        alert("הקוד נשמר. כעת תוכל להיכנס עם הקוד הזה.");
        showApp();
    } else if (userPIN === savedPIN) {
        // כניסה תקינה
        showApp();
        localStorage.setItem("localFailedAttempts", "0");
    } else {
        // ניסיון שגוי
        attempts++;
        localStorage.setItem("localFailedAttempts", attempts.toString());
        document.getElementById("errorMsg").style.display = "block";

        if (attempts >= MAX_LOCAL_ATTEMPTS) {
            localStorage.setItem("childLockEnabled", "true");
            alert("🚫 נעילה מקומית הופעלה. נא להזין סיסמת ילדים.");
        }
    }
});

// הצגת המסך הראשי אחרי כניסה
function showApp() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
}

// איפוס PIN קיים
function resetPIN() {
    const savedPIN = localStorage.getItem("userPIN");
    const answer = prompt("כדי לאפס את הקוד, הזן את הקוד הנוכחי:");

    if (answer === savedPIN) {
        const newPIN = prompt("הזן קוד PIN חדש (4 ספרות):");
        if (newPIN && newPIN.length === 4) {
            localStorage.setItem("userPIN", newPIN);
            alert("הקוד עודכן בהצלחה ✅");
        } else {
            alert("קוד לא תקין");
        }
    } else {
        alert("הקוד שהוזן שגוי ❌");
    }
}

// רישום טביעת אצבע
function registerFingerprint() {
    if (!window.PublicKeyCredential) {
        alert("המכשיר שלך לא תומך בזיהוי ביומטרי");
        return;
    }

    navigator.credentials.get({
        publicKey: {
            challenge: new Uint8Array(32),
            timeout: 60000,
            allowCredentials: [],
            userVerification: "preferred"
        }
    }).then((cred) => {
        console.log("זיהוי ביומטרי הצליח ✅", cred);
        localStorage.setItem("fingerprintEnabled", "true");
        alert("טביעת האצבע הופעלה.");
    }).catch((err) => {
        console.warn("נכשל הזיהוי:", err);
        alert("נכשל הזיהוי הביומטרי ❌");
    });
}

// ניסיון טביעת אצבע
function tryFingerprintLogin() {
    if (!window.PublicKeyCredential) {
        alert("המכשיר שלך לא תומך בזיהוי ביומטרי");
        return;
    }

    navigator.credentials.get({
        publicKey: {
            challenge: new Uint8Array(32),
            timeout: 60000,
            allowCredentials: [],
            userVerification: "required"
        }
    }).then((cred) => {
        console.log("זיהוי ביומטרי הצליח ✅", cred);
        showApp();
    }).catch((err) => {
        console.warn("נכשל הזיהוי:", err);
    });
}
