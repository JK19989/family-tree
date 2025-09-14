document.addEventListener('DOMContentLoaded', () => {
    // 確認 login.html 裡的 Firebase Auth 物件已經準備好
    if (!window.firebaseAuth) {
        console.error("Firebase Auth SDK 尚未載入！請檢查 login.html 中的 script 標籤。");
        document.getElementById('login-error').textContent = '登入服務載入失敗，請重新整理頁面。';
        return;
    }

    const auth = window.firebaseAuth;
    const loginForm = document.getElementById('login-form');
    const errorMessageDiv = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.textContent = ''; 

        // Firebase Auth 使用 Email 作為帳號
        const email = document.getElementById('username').value; 
        const password = document.getElementById('password').value;

        try {
            // 使用 Firebase 的 signInWithEmailAndPassword 函式進行登入
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log("Firebase 登入成功:", user.email);

            // 根據登入的 email 來判斷是否為管理員
            // 記得要去 Firebase 後台建立對應的帳號
            //以下isAdminUser 是管理員，isAdminUser 是工程管理員
            const isAdminUser = ['admin@family.com', 'root@family.com', 'test@family.com', 'cool5122001222@yahoo.com.tw'].includes(email);
            const isSysAdminUser = email === 'root@family.com';

            const authData = {
                isLoggedIn: true,
                displayName: user.displayName || user.email, // 優先使用顯示名稱，否則用 email
                username: user.email,
                isAdmin: isAdminUser,
                isSysAdmin: isSysAdminUser
            };

            // 使用 localStorage 儲存登入狀態
            localStorage.setItem('authStatus', JSON.stringify(authData));
            
            // 跳轉到主頁
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Firebase 登入失敗:', error);
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessageDiv.textContent = '帳號或密碼錯誤！';
                    break;
                case 'auth/invalid-email':
                    errorMessageDiv.textContent = '帳號格式不正確。';
                    break;
                default:
                    errorMessageDiv.textContent = '登入時發生未知錯誤。';
            }
        }
    });

    // --- v4.2 忘記密碼功能 ---
    const forgotPasswordLink = document.getElementById('forgot-password');
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        errorMessageDiv.textContent = '';

        const email = document.getElementById('username').value;
        if (!email) {
            errorMessageDiv.textContent = '請先在帳號欄位輸入您的 Email，然後再點擊「忘記密碼」。';
            return;
        }

        try {
            await auth.sendPasswordResetEmail(email);
            alert(`密碼重設信件已寄送到 ${email}！\n請檢查您的信箱（包含垃圾郵件匣），並依照信中指示重設密碼。`);
        } catch (error) {
            console.error("發送密碼重設信件失敗:", error);
            errorMessageDiv.textContent = '無法發送密碼重設信件，請確認 Email 是否為已註冊的帳號。';
        }
    });
});