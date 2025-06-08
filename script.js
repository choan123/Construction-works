// התחברות ל-Supabase
const supabaseUrl = "https://ptwlvrtzjwsvzrbuepvs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0d2x2cnR6andzdnpyYnVlcHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzAyMjIsImV4cCI6MjA2NDkwNjIyMn0.R7ITezkrnw5wD3ab_sQ6idXX1e7Cn-0_SFFAlVX2BC0";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// בדיקה אם יש נעילה גלובלית
async function isGloballyLocked() {
    const { data, error } = await supabase
        .from("global_security_status")
        .select("is_globally_locked")
        .order("id", { ascending: false })
        .limit(1);
    if (error) {
        console.error("שגיאה בבדיקה:", error);
        return false;
    }
    return data.length > 0 && data[0].is_globally_locked;
}

// עדכון מספר ניסיונות גלובליים
async function incrementGlobalAttempts() {
    let { data, error } = await supabase
        .from("global_security_status")
        .select("*")
        .order("id", { ascending: false })
        .limit(1);

    if (error || data.length === 0) {
        await supabase.from("global_security_status").insert({ global_attempts: 1 });
        return;
    }

    const current = data[0];
    const attempts = current.global_attempts + 1;
    const isLocked = attempts >= 20;

    await supabase
        .from("global_security_status")
        .update({
            global_attempts: attempts,
            is_globally_locked: isLocked
        })
        .eq("id", current.id);
}

// טופס כניסה עם PIN
const MAX_LOCAL_ATTEMPTS = 5;
document.getElementById("pinForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const globallyLocked = await isGloballyLocked();
    if (globallyLocked) {
        const master = prompt("🔒 המערכת נעולה. הזן קוד מפתח לשחרור:");
        if (master === "alio123alio123A1") {
            await supabase.from("global_security_status").insert({
                global_attempts: 0,
                is_globally_locked: false
            });
            alert("✅ שחררת את הנעילה. נסה שוב.");
        } else {
            alert("❌ קוד מפתח שגוי.");
        }
        return;
    }

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
        localStorage.setItem("userPIN", userPIN);
        alert("הקוד נשמר. כעת תוכל להיכנס עם הקוד הזה.");
        showApp();
    } else if (userPIN === savedPIN) {
        showApp();
        localStorage.setItem("localFailedAttempts", "0");
    } else {
        attempts++;
        localStorage.setItem("localFailedAttempts", attempts.toString());
        document.getElementById("errorMsg").style.display = "block";

        await incrementGlobalAttempts();

        if (attempts >= MAX_LOCAL_ATTEMPTS) {
            localStorage.setItem("childLockEnabled", "true");
            alert("🚫 נעילה מקומית הופעלה. נא להזין סיסמת ילדים.");
        }
    }
});
