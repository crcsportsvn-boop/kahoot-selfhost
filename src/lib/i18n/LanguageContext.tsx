'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    // Common / Nav
    gameTitle: 'QuizLive',
    serverless: 'Trực Tiếp',
    joinGame: 'Vào chơi',
    hostDashboard: 'Host Quản Lý',
    lock: 'Khóa',
    unlock: 'Mở Khóa Quản Trị',
    passwordPrompt: 'Vui lòng nhập mật mã bảo vệ để truy cập Dashboard:',
    passwordPlaceholder: 'Nhập mã bảo vệ...',
    passwordError: 'Mật khẩu không chính xác. Vui lòng thử lại!',
    adminArea: 'Khu Vực Quản Trị Viên',
    securedSession: 'Bảo mật phiên đăng nhập quản trị',

    // Home
    homeBadge: 'Nền tảng Trắc Nghiệm Thời Gian Thực',
    homeHeadline1: 'Đấu Trí Trực Tiếp',
    homeHeadline2: 'Cực Nhanh, Cực Vui',
    homeSubtitle: 'Nhập mã PIN 6 số từ màn hình máy chiếu để tham gia ngay vào vòng thi!',
    gamePinLabel: 'Nhập Mã PIN Trò Chơi',
    enterPinError: 'Vui lòng nhập mã PIN',
    pinLengthError: 'Mã PIN bao gồm 6 chữ số',
    joinNowBtn: 'Vào Chơi Ngay',

    // Dashboard
    dashboardBadge: 'Khu Vực Quản Lý & Điều Hành',
    dashboardTitle: 'Bộ Đề Trắc Nghiệm Của Bạn',
    dashboardSubtitle: 'Tạo mới, chỉnh sửa, đính kèm hình ảnh và nhập từ file Excel/CSV',
    downloadSampleBtn: 'Tải Mẫu Excel',
    importExcelBtn: 'Nhập Excel / CSV Tạo Đề',
    createQuizBtn: 'Tạo Bộ Đề Mới',
    questionsCount: 'câu hỏi',
    playLiveBtn: 'Phát Trực Tiếp',
    editQuizTooltip: 'Chỉnh sửa bộ đề và câu hỏi',
    deleteQuizTooltip: 'Xóa bộ đề này',
    noQuizzesTitle: 'Chưa Có Bộ Đề Nào',
    noQuizzesDesc: 'Bấm nút "Tạo Bộ Đề Mới" hoặc "Nhập Excel / CSV" để tải bộ đề đầu tiên!',
    createFirstQuiz: 'Tạo Bộ Đề Đầu Tiên',
    confirmDeleteQuiz: 'Bạn có chắc chắn muốn xóa bộ đề này cùng toàn bộ câu hỏi?',
    loadingQuizzes: 'Đang tải danh sách bộ đề từ Supabase...',

    // Quiz Editor Modal
    editQuizTitle: 'Chỉnh Sửa Bộ Câu Hỏi',
    createQuizTitle: 'Tạo Bộ Câu Hỏi Mới',
    quizTitleLabel: 'Tiêu đề bộ đề *',
    quizDescLabel: 'Mô tả ngắn',
    quizTitlePlaceholder: 'VD: Đấu trí Lập Trình & Công Nghệ 2026...',
    quizDescPlaceholder: 'Mô tả về bộ câu hỏi...',
    questionsList: 'Danh sách câu hỏi',
    addQuestionBtn: 'Thêm câu hỏi',
    questionNum: 'Câu hỏi',
    questionTypeLabel: 'Loại câu hỏi',
    typeMultipleChoice: 'Trắc nghiệm 4 đáp án',
    typeTrueFalse: 'Đúng / Sai',
    typeFillBlank: 'Điền từ vào chỗ trống',
    timeLimitLabel: 'Thời gian',
    promptLabel: 'Nội dung câu hỏi',
    promptPlaceholder: 'Nhập câu hỏi...',
    imageUploadLabel: 'Hình ảnh minh họa (tải từ máy hoặc dán link)',
    uploadFromComputer: 'Tải ảnh từ máy tính',
    orPasteUrl: 'hoặc dán link ảnh https://...',
    sampleImages: 'Ảnh mẫu nhanh:',
    optionsLabel: 'Các phương án (Tích chọn nút tròn để chọn đáp án đúng)',
    trueLabel: 'Đúng',
    falseLabel: 'Sai',
    correctAnswerBadge: '(Đáp án đúng)',
    keywordsLabel: 'Từ khóa đáp án đúng (cách nhau bằng dấu chấm phẩy ";")',
    keywordsPlaceholder: 'VD: H2O; nước',
    cancelBtn: 'Hủy',
    saveChangesBtn: 'Cập Nhật Bộ Đề',
    saveNewBtn: 'Hoàn Tất & Lưu Bộ Đề',
    savingText: 'Đang lưu...',

    // Import Excel Modal
    importModalTitle: 'Nhập Câu Hỏi từ Excel / CSV Tạo Bộ Đề Mới',
    importModalDesc: 'Tải bảng tính lên để hệ thống tự động kiểm tra và tạo bộ đề',
    downloadSamplePrompt: 'Chưa có file mẫu? Tải file mẫu chuẩn tại đây:',
    dragDropText: 'Kéo thả tệp Excel (.xlsx, .xls) hoặc CSV vào đây',
    orClickToPick: 'hoặc nhấn để chọn tệp từ máy tính của bạn',
    parsingText: 'Đang phân tích và kiểm tra dữ liệu bảng tính...',
    previewTitle: 'Bản xem trước dữ liệu',
    validText: 'Hợp lệ',
    invalidText: 'Không hợp lệ',
    rowCol: 'Hàng',
    typeCol: 'Loại',
    questionCol: 'Câu hỏi',
    optionsCol: 'Phương án',
    correctCol: 'Đáp án đúng',
    timeCol: 'Thời gian',
    statusCol: 'Trạng thái',
    quizNamePrompt: 'Tên bộ đề mới:',
    saveImportBtn: 'Tạo Bộ Đề Mới Với',

    // Host Game Screen
    roomDirect: 'Phòng Đấu Trực Tiếp',
    scanQrHelp: 'Người chơi quét mã QR hoặc truy cập đường link để tham gia',
    gamePinTitle: 'Mã PIN Trò Chơi',
    copyLinkTooltip: 'Sao chép liên kết phòng',
    scanCameraHelp: 'Quét mã bằng camera điện thoại',
    playersInRoom: 'Người Chơi Đã Vào Phòng',
    playersAutoUpdate: 'Danh sách sẽ tự động cập nhật ngay khi người chơi tham gia',
    playersCount: 'người chơi',
    waitingPlayers: 'Đang chờ người chơi tham gia...',
    openToJoin: 'Hãy mở trang /play/',
    readyBadge: 'Sẵn sàng',
    lobbyMusicNotice: 'Nhạc chờ đang phát. Bấm bắt đầu khi mọi người đã vào đủ.',
    startGameBtn: 'Bắt đầu trò chơi',
    startingBtn: 'Đang khởi động...',
    
    // Host Controls
    autoNextLabel: 'Tự động chuyển bước',
    autoNextOn: 'BẬT',
    autoNextOff: 'TẮT',
    themeCustomBtn: 'Tùy Biến Giao Diện',
    endGameBtn: 'Kết thúc trò chơi',
    confirmEndGameTitle: 'Xác nhận kết thúc trò chơi?',
    confirmEndGameDesc: 'Bạn có muốn kết thúc vòng đấu ngay bây giờ và xem bục vinh danh Podium?',
    endGameNowBtn: 'Kết Thúc & Xem Podium',
    cancelEndBtn: 'Tiếp Tục Chơi',

    // Host Question View
    questionWord: 'Câu hỏi',
    answersWord: 'đã trả lời',
    skipNowBtn: 'Hết giờ ngay',
    typeMcTitle: 'Trắc Nghiệm 4 Đáp Án',
    typeTfTitle: 'Đúng / Sai',
    typeFillTitle: 'Điền Từ Vào Chỗ Trống',
    fillHintHost: 'Các bạn hãy nhập đáp án chính xác trên màn hình điện thoại!',

    // Host Results View
    questionResultTitle: 'Kết Quả Câu Hỏi',
    seeLeaderboardBtn: 'Xem Bảng Xếp Hạng',
    acceptedAnswers: 'Đáp án được chấp nhận:',
    totalAnswersCount: 'Tổng số người chơi đã tham gia trả lời:',

    // Host Leaderboard
    leaderboardTitle: 'Bảng Xếp Hạng Điểm Số',
    leaderboardSubtitle: 'Top các chiến binh có điểm số cao nhất hiện tại',
    nextQuestionBtn: 'Câu hỏi tiếp theo',
    seePodiumBtn: 'Xem Bục Vinh Danh (Podium)',
    streakFire: 'câu đúng liên tiếp!',
    pointsWord: 'Điểm',

    // Host Podium
    podiumBadge: 'Vinh Danh Nhà Vô Địch',
    podiumTitle: 'Bục Vinh Danh - Podium',
    goldRank: 'Quán Quân',
    silverRank: 'Á Quân',
    bronzeRank: 'Hạng Ba',
    playAgainBtn: 'Chơi Lại Vòng Này',
    returnDashboardBtn: 'Về Bảng Điều Khiển Host',

    // Player View
    chooseNicknameTitle: 'Chọn Biệt Danh',
    chooseNicknameDesc: 'Chọn linh vật đại diện và tên của bạn để thi đấu',
    chooseAvatar: 'Chọn Avatar',
    nicknameInputPlaceholder: 'Nhập tên của bạn...',
    readyToJoinBtn: 'Sẵn Sàng Tham Gia!',
    joiningText: 'Đang vào phòng...',
    onlineStatus: 'Trực tuyến',
    inRoomBadge: 'Bạn đã vào phòng thi đấu!',
    lookAtHostScreen: 'Hãy nhìn lên màn hình lớn của Host. Trò chơi sẽ bắt đầu trong giây lát!',
    speedTip: 'Mẹo: Câu trả lời càng nhanh thì số điểm nhận được càng cao!',
    getReadyTitle: 'Chuẩn Bị...',
    questionComing: 'Câu hỏi sắp xuất hiện trên màn hình!',
    answeredTitle: 'Đã Gửi Câu Trả Lời!',
    yourAnswer: 'Đáp án của bạn:',
    waitingOthers: 'Đang đợi hoàn thành lượt này...',
    correctTitle: 'Chính Xác!',
    wrongTitle: 'Chưa Đúng Rồi!',
    correctPraise: 'Bạn đã trả lời rất nhanh và chuẩn xác!',
    wrongEncourage: 'Đừng nản lòng, hãy bứt phá ở câu hỏi tiếp theo!',
    roundPoints: 'Điểm câu này',
    totalScoreLabel: 'Tổng điểm:',
    streakCount: 'câu đúng liên tiếp!',
    gameOverTitle: 'Trò Chơi Kết Thúc!',
    congratsTop: 'Chúc mừng bạn!',
    topPodiumMessage: 'Bạn đã lọt vào',
    finalScoreLabel: 'Tổng điểm chung cuộc',
    nicknameRequired: 'Vui lòng nhập biệt danh',
    joinRoomError: 'Không thể tham gia phòng',
    serverError: 'Lỗi kết nối máy chủ',
    watchHostLeaderboard: 'Hãy quan sát màn hình Host để xem vị trí và thứ tự xếp hạng của bạn!',
    currentScore: 'Điểm số hiện tại',
    greatJobPodium: 'Bạn đã thi đấu rất xuất sắc! Hãy nhìn lên màn hình lớn của Host để xem bục vinh danh toàn thể phòng chơi.',
  },

  en: {
    // Common / Nav
    gameTitle: 'QuizLive',
    serverless: 'Live',
    joinGame: 'Join Game',
    hostDashboard: 'Host Dashboard',
    lock: 'Lock',
    unlock: 'Unlock Admin Access',
    passwordPrompt: 'Please enter the protection passcode to access the Dashboard:',
    passwordPlaceholder: 'Enter passcode...',
    passwordError: 'Incorrect passcode. Please try again!',
    adminArea: 'Host Admin Portal',
    securedSession: 'Secured administrative session',

    // Home
    homeBadge: 'Real-Time Interactive Quiz Platform',
    homeHeadline1: 'Live Trivia Battle',
    homeHeadline2: 'Ultra Fast, Super Fun',
    homeSubtitle: 'Enter the 6-digit PIN from the main screen to join the game right now!',
    gamePinLabel: 'Enter Game PIN',
    enterPinError: 'Please enter a Game PIN',
    pinLengthError: 'Game PIN must be 6 digits',
    joinNowBtn: 'Join Game Now',

    // Dashboard
    dashboardBadge: 'Host Control Center',
    dashboardTitle: 'Your Quiz Collections',
    dashboardSubtitle: 'Create, edit, attach images, and import questions from Excel/CSV',
    downloadSampleBtn: 'Download Excel Template',
    importExcelBtn: 'Import Excel / CSV',
    createQuizBtn: 'Create New Quiz',
    questionsCount: 'questions',
    playLiveBtn: 'Host Live Game',
    editQuizTooltip: 'Edit quiz and questions',
    deleteQuizTooltip: 'Delete this quiz',
    noQuizzesTitle: 'No Quizzes Found',
    noQuizzesDesc: 'Click "Create New Quiz" or "Import Excel / CSV" to add your first quiz!',
    createFirstQuiz: 'Create First Quiz',
    confirmDeleteQuiz: 'Are you sure you want to delete this quiz and all its questions?',
    loadingQuizzes: 'Loading quizzes from Supabase...',

    // Quiz Editor Modal
    editQuizTitle: 'Edit Quiz Collection',
    createQuizTitle: 'Create New Quiz',
    quizTitleLabel: 'Quiz Title *',
    quizDescLabel: 'Short Description',
    quizTitlePlaceholder: 'e.g. 2026 Tech & Science Trivia...',
    quizDescPlaceholder: 'Describe this quiz collection...',
    questionsList: 'Question List',
    addQuestionBtn: 'Add Question',
    questionNum: 'Question',
    questionTypeLabel: 'Question Type',
    typeMultipleChoice: 'Multiple Choice (4 Options)',
    typeTrueFalse: 'True / False',
    typeFillBlank: 'Fill in the Blank',
    timeLimitLabel: 'Time Limit',
    promptLabel: 'Question Prompt',
    promptPlaceholder: 'Enter question text...',
    imageUploadLabel: 'Question Image (Upload file or paste URL)',
    uploadFromComputer: 'Upload image from computer',
    orPasteUrl: 'or paste image URL https://...',
    sampleImages: 'Sample presets:',
    optionsLabel: 'Options (Click radio button to mark correct answer)',
    trueLabel: 'True',
    falseLabel: 'False',
    correctAnswerBadge: '(Correct Answer)',
    keywordsLabel: 'Accepted keywords (separated by semicolon ";")',
    keywordsPlaceholder: 'e.g. H2O; water',
    cancelBtn: 'Cancel',
    saveChangesBtn: 'Update Quiz',
    saveNewBtn: 'Save & Create Quiz',
    savingText: 'Saving...',

    // Import Excel Modal
    importModalTitle: 'Import Excel / CSV to Create New Quiz',
    importModalDesc: 'Upload a spreadsheet to automatically validate and create a quiz',
    downloadSamplePrompt: 'Need the template? Download it here:',
    dragDropText: 'Drag and drop Excel (.xlsx, .xls) or CSV here',
    orClickToPick: 'or click to browse files from your computer',
    parsingText: 'Parsing and validating spreadsheet data...',
    previewTitle: 'Data Preview',
    validText: 'Valid',
    invalidText: 'Invalid',
    rowCol: 'Row',
    typeCol: 'Type',
    questionCol: 'Question',
    optionsCol: 'Options',
    correctCol: 'Correct Answer',
    timeCol: 'Time',
    statusCol: 'Status',
    quizNamePrompt: 'New Quiz Title:',
    saveImportBtn: 'Create Quiz With',

    // Host Game Screen
    roomDirect: 'Live Game Arena',
    scanQrHelp: 'Players can scan QR code or open link to join',
    gamePinTitle: 'Game PIN',
    copyLinkTooltip: 'Copy room link',
    scanCameraHelp: 'Scan with mobile camera',
    playersInRoom: 'Players in Room',
    playersAutoUpdate: 'List updates automatically as players join',
    playersCount: 'players',
    waitingPlayers: 'Waiting for players to join...',
    openToJoin: 'Open /play/',
    readyBadge: 'Ready',
    lobbyMusicNotice: 'Lobby music is playing. Click Start when everyone is in.',
    startGameBtn: 'Start Game',
    startingBtn: 'Starting...',

    // Host Controls
    autoNextLabel: 'Auto-Advance Mode',
    autoNextOn: 'ON',
    autoNextOff: 'OFF',
    themeCustomBtn: 'Customize Theme',
    endGameBtn: 'End Game',
    confirmEndGameTitle: 'End Game Now?',
    confirmEndGameDesc: 'Do you want to end the game immediately and reveal the final Podium?',
    endGameNowBtn: 'End & Show Podium',
    cancelEndBtn: 'Resume Playing',

    // Host Question View
    questionWord: 'Question',
    answersWord: 'answered',
    skipNowBtn: 'Time Up Now',
    typeMcTitle: 'Multiple Choice',
    typeTfTitle: 'True / False',
    typeFillTitle: 'Fill in the Blank',
    fillHintHost: 'Players type the correct answer on their phones!',

    // Host Results View
    questionResultTitle: 'Question Results',
    seeLeaderboardBtn: 'View Leaderboard',
    acceptedAnswers: 'Accepted answers:',
    totalAnswersCount: 'Total players who submitted an answer:',

    // Host Leaderboard
    leaderboardTitle: 'Score Leaderboard',
    leaderboardSubtitle: 'Top players with highest scores right now',
    nextQuestionBtn: 'Next Question',
    seePodiumBtn: 'View Final Podium',
    streakFire: 'streak in a row!',
    pointsWord: 'Pts',

    // Host Podium
    podiumBadge: 'Champion Celebration',
    podiumTitle: 'Winners Podium',
    goldRank: 'Champion',
    silverRank: 'Runner Up',
    bronzeRank: '3rd Place',
    playAgainBtn: 'Play This Again',
    returnDashboardBtn: 'Return to Dashboard',

    // Player View
    chooseNicknameTitle: 'Choose Nickname',
    chooseNicknameDesc: 'Pick your avatar mascot and enter your name',
    chooseAvatar: 'Choose Avatar',
    nicknameInputPlaceholder: 'Enter your nickname...',
    readyToJoinBtn: 'Ready to Join!',
    joiningText: 'Joining room...',
    onlineStatus: 'Online',
    inRoomBadge: 'You are in the game!',
    lookAtHostScreen: 'Look at the main host screen. The game will start shortly!',
    speedTip: 'Tip: The faster you answer, the more points you get!',
    getReadyTitle: 'Get Ready...',
    questionComing: 'Question is about to appear on screen!',
    answeredTitle: 'Answer Submitted!',
    yourAnswer: 'Your answer:',
    waitingOthers: 'Waiting for this round to complete...',
    correctTitle: 'Correct!',
    wrongTitle: 'Incorrect!',
    correctPraise: 'You answered quickly and accurately!',
    wrongEncourage: 'Don’t give up, catch up on the next question!',
    roundPoints: 'Points this round',
    totalScoreLabel: 'Total score:',
    streakCount: 'streak in a row!',
    gameOverTitle: 'Game Over!',
    congratsTop: 'Congratulations!',
    topPodiumMessage: 'You finished in',
    finalScoreLabel: 'Final Total Score',
    nicknameRequired: 'Please enter a nickname',
    joinRoomError: 'Unable to join game room',
    serverError: 'Server connection error',
    watchHostLeaderboard: 'Look at the host screen to see your rank and position!',
    currentScore: 'Current Score',
    greatJobPodium: 'Great job! Look up at the host screen to see the full podium ceremony.',
  }
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['vi'];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'vi',
  setLang: () => {},
  t: translations.vi
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('vi');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quiz_lang') as Language;
      if (saved === 'vi' || saved === 'en') {
        setLangState(saved);
      }
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_lang', l);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
