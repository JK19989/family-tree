document.addEventListener('DOMContentLoaded', () => {
    // 確認 register.html 裡的 Firebase Auth 物件已經準備好
    if (!window.firebaseAuth) {
        console.error("Firebase Auth SDK 尚未載入！請檢查 register.html 中的 script 標籤。");
        document.getElementById('register-error').textContent = '註冊服務載入失敗，請重新整理頁面。';
        return;
    }

    const auth = window.firebaseAuth;
    const registerForm = document.getElementById('register-form');
    const errorMessageDiv = document.getElementById('register-error');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.textContent = '';

        const displayName = document.getElementById('displayName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // --- 前端驗證 ---
        if (password.length < 6) {
            errorMessageDiv.textContent = '密碼長度至少需要 6 位數！';
            return;
        }
        if (password !== confirmPassword) {
            errorMessageDiv.textContent = '兩次輸入的密碼不一致！';
            return;
        }

        try {
            // 步驟 1: 在 Authentication 中建立帳號
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log("Firebase Auth 註冊成功:", user.uid);

            // 步驟 2: 更新 Auth 中的個人資料 (顯示名稱)
            await user.updateProfile({
                displayName: displayName
            });
            console.log("使用者 Auth Profile 已更新:", displayName);
            
            // --- v4.2 新增步驟：在 Firestore 中建立對應的 user 文件 ---
            const db = firebase.firestore(); // 取得 Firestore 服務
            const userDocRef = db.collection("users").doc(user.uid); // 使用 Auth UID 作為文件 ID

            await userDocRef.set({
                uid: user.uid,
                email: email,
                displayName: displayName,
                createdAt: new Date() // 記錄建立時間
            });
            console.log("Firestore user 文件已建立:", user.uid);
            // --- 新增步驟結束 ---

            alert(`帳號 ${displayName} (${email}) 註冊成功！\n將為您導向登入頁面。`);
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Firebase 註冊失敗:', error);
            // ... (錯誤處理部分不變) ...
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessageDiv.textContent = '這個 Email 已經被註冊過了！';
                    break;
                case 'auth/invalid-email':
                    errorMessageDiv.textContent = 'Email 格式不正確。';
                    break;
                case 'auth/weak-password':
                    errorMessageDiv.textContent = '密碼強度不足！';
                    break;
                default:
                    errorMessageDiv.textContent = '註冊時發生未知錯誤。';
            }
        }
    });

    // --- v4.2 Email Domain Helper ---
    const emailInput = document.getElementById('email');
    const domainButtons = document.getElementById('domain-buttons');

    domainButtons.addEventListener('click', (e) => {
        // 確認點擊的是按鈕
        if (e.target.tagName === 'BUTTON') {
            const domain = e.target.dataset.domain;
            const currentEmail = emailInput.value;
            
            // 找到 @ 的位置
            const atIndex = currentEmail.indexOf('@');
            
            let baseName = currentEmail;
            if (atIndex !== -1) {
                // 如果已經有 @，只取前面的部分
                baseName = currentEmail.substring(0, atIndex);
            }
            
            // 將前面的部分與新的網域結合，並更新到輸入框中
            emailInput.value = baseName + domain;
            emailInput.focus(); // 將焦點移回輸入框，方便使用者繼續操作
        }
    });


});