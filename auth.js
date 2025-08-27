document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessageDiv = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.textContent = ''; // 清除舊的錯誤訊息

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            // 從主頁讀取資料來驗證
            const users = await fetchUsersFromMainPage();
            
            const foundUser = users.find(u => u.user === username && u.pass === password);

            if (foundUser) {
                // 登入成功
                const isAdminUser = ['admin', 'root'].includes(username);
                const isSysAdminUser = username === 'root';

                const authData = {
                    isLoggedIn: true,
                    displayName: foundUser.displayName,
                    username: foundUser.user,
                    isAdmin: isAdminUser,
                    isSysAdmin: isSysAdminUser
                };

                // 使用 localStorage 儲存登入狀態
                localStorage.setItem('authStatus', JSON.stringify(authData));
                
                // 跳轉到主頁
                window.location.href = 'index.html';

            } else {
                // 登入失敗
                errorMessageDiv.textContent = '帳號或密碼錯誤！';
            }
        } catch (error) {
            console.error('讀取使用者資料時發生錯誤:', error);
            errorMessageDiv.textContent = '無法驗證，請確認主檔案是否正常。';
        }
    });

    // 這個函式會去抓取 index.html 的內容，並解析出裡面的使用者資料
    async function fetchUsersFromMainPage() {
        try {
            const response = await fetch('index.html');
            if (!response.ok) {
                throw new Error(`無法載入 index.html, 狀態: ${response.status}`);
            }
            const htmlText = await response.text();
            
            // 使用 DOMParser 來解析 HTML 字串
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            
            // 找到儲存資料的 script 標籤
            const dataScript = doc.getElementById('family-data');
            
            if (!dataScript || !dataScript.textContent.trim()) {
                 // 如果找不到嵌入資料，就從預設資料結構中拿
                console.warn("在 index.html 中找不到嵌入的 family-data，將使用程式碼中的預設使用者。");
                return [
                    {user: 'root', pass: 'root', displayName: '工程管理員'},
                    {user: 'admin', pass: 'password', displayName: '最高管理員'},
                    {user: '0', pass: '0', displayName: '測試人員'}
                ];
            }

            const parsedData = JSON.parse(dataScript.textContent);
            
            // 返回最新一筆歷史紀錄中的使用者列表
            return parsedData.history[parsedData.currentIndex].data.users;

        } catch (e) {
            console.error("解析 index.html 中的使用者資料失敗:", e);
            throw e;
        }
    }
});