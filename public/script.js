document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('input');
    const outputDiv = document.getElementById('output');
    const chatWindow = document.getElementById('chat-window'); // Chat penceresi

    // Renk değişimleri için renk haritası
    const colorMap = {
        '1': '#FF0000',
        '2': '#00FF00',
        '3': '#0000FF',
        '4': '#FFFF00',
        '5': '#FFA500',
        '6': '#800080',
        '7': '#FFC0CB',
        '8': '#808080',
        '9': '#A52A2A',
        'a': '#000000',
    };

    let isFreeMode = false; // Free mode durumu
    let offset = { x: 0, y: 0 }; // Pencere konumu için ofset

    // Kullanıcının girdiği mesajı backend'e gönder ve yanıtı al
    function sendMessage(message) {
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        })
            .then((response) => response.json())
            .then((data) => {
                const formattedMessage = formatMessage(message);
                const formattedResponse = formatMessage(data.response);

                outputDiv.innerHTML += `> ${formattedMessage}<br>${formattedResponse}<br>`;
                outputDiv.scrollTop = outputDiv.scrollHeight;
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    // Kullanıcı Enter'a basınca mesajı gönder
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const message = inputField.value.trim();
            if (message) {
                // Renk komutunu kontrol et
                if (message.startsWith('//color ')) {
                    const colorCode = message.split(' ')[1];
                    if (colorMap[colorCode]) {
                        document.body.style.backgroundColor = colorMap[colorCode];
                        outputDiv.innerHTML += `> Renk değiştirildi: ${colorMap[colorCode]}<br>`;
                    } else {
                        outputDiv.innerHTML += '> Geçersiz renk kodu!<br>';
                    }
                }
                // Free mode komutunu kontrol et
                else if (message === '//free-mod') {
                    isFreeMode = !isFreeMode; // Modu aç veya kapa
                    outputDiv.innerHTML += `> Free mode ${isFreeMode ? 'açıldı' : 'kapatıldı'}!<br>`;
                    if (isFreeMode) {
                        enableDrag();
                    } else {
                        disableDrag();
                    }
                } else {
                    sendMessage(message);
                }
                inputField.value = '';
            }
        }
    });

    // Mesajı kalın olarak gösterme fonksiyonu
    function formatMessage(message) {
        if (message.startsWith('**') && message.endsWith('**')) {
            return `<strong>${message.slice(2, -2)}</strong>`;
        }
        return message;
    }

    // Chat penceresini sürükleme modunu etkinleştir
    function enableDrag() {
        chatWindow.style.cursor = 'move'; // Fare imlecini değiştir

        chatWindow.addEventListener('mousedown', onMouseDown);

        function onMouseDown(e) {
            offset.x = e.clientX - chatWindow.getBoundingClientRect().left;
            offset.y = e.clientY - chatWindow.getBoundingClientRect().top;

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        function onMouseMove(e) {
            chatWindow.style.position = 'absolute'; // Pencereyi mutlak pozisyona al
            chatWindow.style.left = e.clientX - offset.x + 'px';
            chatWindow.style.top = e.clientY - offset.y + 'px';
        }

        function onMouseUp() {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }
    }

    // Chat penceresini sürükleme modunu devre dışı bırak
    function disableDrag() {
        chatWindow.style.cursor = 'default'; // Fare imlecini varsayılan yap
        chatWindow.removeEventListener('mousedown', onMouseDown);
    }
});
