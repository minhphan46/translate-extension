Tôi muốn làm một extension cho chrome có chức năng dịch nội dung trên trang web. Từ tiếng anh sang tiếng việt và tiếng việt sang tiếng anh.
Feature.
- Có giao diện Dashboard & Settings để user có thể config API Key Chat GPT.
- Người dùng bôi đen một đoạn text trên trang web, sau đó bấm ctrl thì sẽ hiện một pop up nhỏ dịch nội dung đó sang ngôn ngữ còn lại.
- Khi dịch từ tiếng việt sang tiếng anh, call API của chatGPT yêu cầu nó cho tôi 3 option dịch nội dung đó sang tiếng anh. Hiển thị cho người dùng chọn.
- Khi dịch từ tiếng anh sang tiếng việt, chỉ cần dịch sang tiếng việt, không cần call API của chatGPT. Dùng thư viện có sẵn. 
- Giao diện phải đẹp và hiện đại. Dùng tailwind css. Giao diện pop up hiển thị khi dịch, sẽ hiển thị như sau:
  - [original text]   (icon speaker original) 
  - [translated text] (icon speaker translated)   (icon copy)
  - icon copy: khi click vào sẽ copy translated text
  - icon Setting: khi click vào sẽ mở ra giao diện dashboard
- Dashboard & Settings
  - Tab Dashboard: hiển thị danh sách các API Key đã cấu hình
  - Tab Settings: hiển thị form để cấu hình API Key
    - Add API Key 
    - Input API Key OpenAI
    - Model 
    - Prompt Template: để trống, user tự điền. Dựa vào prompt template này mà nó sẽ sinh ra các option khi dịch. Ví dụ như prompt yêu cầu: "Hãy dịch câu sau sang tiếng anh, và cho tôi 3 option". Nếu không để gì thì sẽ dùng prompt mặc định.
    - Save

Dựa vào yêu cầu, hãy init và code project chrome extension này.