'use strict';
/* Vùng 1 — Vũng Lầy Chán Nản, Vùng 2 — Cửa Hẹp. Verse text: Bản Truyền Thống 1926 (public domain), copied
   verbatim from BibleQuiz's seed (eBible vie1934); Giăng 14:6 leaves out the narrative lead-in "Vậy Đức Chúa
   Jêsus đáp rằng:", as children's memory-verse cards do. "near" lists are hand-written near-misses: the words
   children most often swap, so passing means remembering the exact wording. */

window.LK_CONTENT = {
  // map spots were traced over the generated map pictures (bg-map, bg-map2)
  regions: [
    {
      id: 'r1',
      name: 'Vũng Lầy Chán Nản',
      story: 'Trên đường về Thành Thiên Quốc, lữ khách sa xuống vũng lầy Chán Nản. Hãy dùng Lời Chúa làm gươm để vượt qua!',
      map: 'bg-map',
      intro: 'intro-region',
      start: { x: 318, y: 628 },
      spots: [{ x: 392, y: 455 }, { x: 497, y: 268 }, { x: 806, y: 190 }, { x: 760, y: 372 }],
    },
    {
      id: 'r2',
      name: 'Cửa Hẹp',
      story: 'Ông Khôn Đời chỉ cho lữ khách một lối tắt dưới chân Núi Sấm Sét, nhưng lối ấy đầy đá lửa! Hãy tin cậy Lời Chúa để tìm lại đường thật và đi tới Cửa Hẹp.',
      map: 'bg-map2',
      intro: 'intro-region2',
      start: { x: 236, y: 596 },
      spots: [{ x: 402, y: 410 }, { x: 772, y: 318 }, { x: 968, y: 250 }],
      gate: { x: 1075, y: 178 },
    },
  ],

  verses: {
    isa4031: {
      ref: 'Ê-sai 40:31',
      theme: 'Khi mệt mỏi, kiệt sức',
      text: 'Nhưng ai trông đợi Đức Giê-hô-va thì chắc được sức mới, cất cánh bay cao như chim ưng; chạy mà không mệt nhọc, đi mà không mòn mỏi.',
      audio: 'v-isa4031',
      chunks: [
        { t: 'Nhưng ai trông đợi Đức Giê-hô-va', near: ['Nhưng ai trông cậy Đức Giê-hô-va', 'Nhưng ai chờ đợi Đức Giê-hô-va'] },
        { t: 'thì chắc được sức mới,', near: ['thì chắc được sức mạnh,', 'thì sẽ được sức mới,'] },
        { t: 'cất cánh bay cao như chim ưng;', near: ['cất cánh bay cao như chim sẻ;', 'cất cánh bay xa như chim ưng;'] },
        { t: 'chạy mà không mệt nhọc,', near: ['chạy mà không mỏi mệt,', 'đi mà không mệt nhọc,'] },
        { t: 'đi mà không mòn mỏi.', near: ['đi mà không mệt mỏi.', 'chạy mà không mòn mỏi.'] },
      ],
      pieces: ['Nhưng ai', 'trông đợi', 'Đức Giê-hô-va', 'thì chắc được', 'sức mới,', 'cất cánh', 'bay cao', 'như chim ưng;',
        'chạy mà', 'không mệt nhọc,', 'đi mà', 'không mòn mỏi.'],
    },

    psa402: {
      ref: 'Thi Thiên 40:2',
      theme: 'Khi bị mắc kẹt, không lối ra',
      text: 'Ngài cũng đem tôi lên khỏi hầm gớm ghê, Khỏi vũng bùn lấm; Ngài đặt chân tôi trên hòn đá, Và làm cho bước tôi vững bền.',
      audio: 'v-psa402',
      chunks: [
        { t: 'Ngài cũng đem tôi lên', near: [] },
        { t: 'khỏi hầm gớm ghê,', near: [] },
        { t: 'Khỏi vũng bùn lấm;', near: [] },
        { t: 'Ngài đặt chân tôi', near: [] },
        { t: 'trên hòn đá,', near: [] },
        { t: 'Và làm cho bước tôi vững bền.', near: [] },
      ],
      // stepping stones: small pieces, each with two look-alikes
      steps: [
        { t: 'Ngài cũng', near: ['Ngài đã', 'Chúa cũng'] },
        { t: 'đem tôi lên', near: ['đưa tôi lên', 'kéo tôi lên'] },
        { t: 'khỏi hầm', near: ['khỏi hố', 'khỏi hang'] },
        { t: 'gớm ghê,', near: ['tối tăm,', 'sâu thẳm,'] },
        { t: 'Khỏi vũng', near: ['Khỏi đầm', 'Khỏi ao'] },
        { t: 'bùn lấm;', near: ['bùn lầy;', 'nước sâu;'] },
        { t: 'Ngài đặt', near: ['Ngài để', 'Ngài dựng'] },
        { t: 'chân tôi', near: ['tay tôi', 'nhà tôi'] },
        { t: 'trên hòn đá,', near: ['trên tảng đá,', 'trên núi cao,'] },
        { t: 'Và làm cho', near: ['Và khiến cho', 'Và giúp cho'] },
        { t: 'bước tôi', near: ['đường tôi', 'lòng tôi'] },
        { t: 'vững bền.', near: ['vững vàng.', 'bền lâu.'] },
      ],
    },

    mat1128: {
      ref: 'Ma-thi-ơ 11:28',
      theme: 'Khi gánh nặng, cần được nghỉ',
      text: 'Hỡi những kẻ mệt mỏi và gánh nặng, hãy đến cùng ta, ta sẽ cho các ngươi được yên nghỉ.',
      audio: 'v-mat1128',
      chunks: [
        { t: 'Hỡi những kẻ mệt mỏi', near: [] },
        { t: 'và gánh nặng,', near: [] },
        { t: 'hãy đến cùng ta,', near: [] },
        { t: 'ta sẽ cho các ngươi', near: [] },
        { t: 'được yên nghỉ.', near: [] },
      ],
      // night path: one word at a time, decoys share the first letter where Vietnamese allows
      words: [
        { t: 'Hỡi', near: ['Hãy', 'Hỏi'] }, { t: 'những', near: ['nhiều', 'nhỏ'] }, { t: 'kẻ', near: ['khi', 'kìa'] },
        { t: 'mệt', near: ['mỏi', 'mới'] }, { t: 'mỏi', near: ['mệt', 'mọi'] }, { t: 'và', near: ['vì', 'vẫn'] },
        { t: 'gánh', near: ['gần', 'ghé'] }, { t: 'nặng,', near: ['nhẹ,', 'nhiều,'] }, { t: 'hãy', near: ['hỡi', 'hay'] },
        { t: 'đến', near: ['đi', 'đây'] }, { t: 'cùng', near: ['cho', 'có'] }, { t: 'ta,', near: ['tôi,', 'thầy,'] },
        { t: 'ta', near: ['tôi', 'tay'] }, { t: 'sẽ', near: ['sao', 'sớm'] }, { t: 'cho', near: ['chung', 'chẳng'] },
        { t: 'các', near: ['cả', 'cùng'] }, { t: 'ngươi', near: ['người', 'ngày'] }, { t: 'được', near: ['đều', 'đi'] },
        { t: 'yên', near: ['êm', 'yêu'] }, { t: 'nghỉ.', near: ['ngủ.', 'nghe.'] },
      ],
      pieces: ['Hỡi những', 'kẻ mệt mỏi', 'và gánh nặng,', 'hãy đến', 'cùng ta,', 'ta sẽ cho', 'các ngươi', 'được yên nghỉ.'],
    },

    prv35: {
      ref: 'Châm Ngôn 3:5-6',
      theme: 'Khi phân vân, không biết chọn đường nào',
      text: 'Hãy hết lòng tin cậy Đức Giê-hô-va, Chớ nương cậy nơi sự thông sáng của con; Phàm trong các việc làm của con, khá nhận biết Ngài, Thì Ngài sẽ chỉ dẫn các nẻo của con.',
      audio: 'v-prv35',
      // scrolls falling on the thunder mountain
      drops: [
        { t: 'Hãy hết lòng', near: ['Hãy hết sức', 'Hãy cả lòng'] },
        { t: 'tin cậy Đức Giê-hô-va,', near: ['tin tưởng Đức Giê-hô-va,', 'trông cậy Đức Giê-hô-va,'] },
        { t: 'Chớ nương cậy', near: ['Chớ trông cậy', 'Chớ dựa vào'] },
        { t: 'nơi sự thông sáng', near: ['nơi sự khôn ngoan', 'nơi sự hiểu biết'] },
        { t: 'của con;', near: ['của mình;', 'của người;'] },
        { t: 'Phàm trong', near: ['Vậy trong', 'Phàm khi'] },
        { t: 'các việc làm của con,', near: ['các việc lành của con,', 'các lời nói của con,'] },
        { t: 'khá nhận biết Ngài,', near: ['khá kính sợ Ngài,', 'hãy nhận biết Ngài,'] },
        { t: 'Thì Ngài sẽ', near: ['Thì Chúa sẽ', 'Thì Ngài đã'] },
        { t: 'chỉ dẫn', near: ['dẫn dắt', 'soi sáng'] },
        { t: 'các nẻo của con.', near: ['các bước của con.', 'các đường của con.'] },
      ],
    },

    jhn146: {
      ref: 'Giăng 14:6',
      theme: 'Khi bị lạc, cần tìm đúng đường',
      text: 'Ta là đường đi, lẽ thật, và sự sống; chẳng bởi ta thì không ai được đến cùng Cha.',
      audio: 'v-jhn146',
      // floating stones that pave the cloud path
      tiles: [
        { t: 'Ta là', near: ['Ta có', 'Ngài là'] },
        { t: 'đường đi,', near: ['đường lối,', 'cửa vào,'] },
        { t: 'lẽ thật,', near: ['sự thật,', 'ánh sáng,'] },
        { t: 'và sự sống;', near: ['và sự sáng;', 'và bình an;'] },
        { t: 'chẳng bởi ta', near: ['chẳng nhờ ta', 'chẳng theo ta'] },
        { t: 'thì không ai', near: ['thì chẳng ai', 'thì không người'] },
        { t: 'được đến', near: ['được về', 'được vào'] },
        { t: 'cùng Cha.', near: ['với Cha.', 'cùng Chúa.'] },
      ],
    },

    psa11911: {
      ref: 'Thi Thiên 119:11',
      theme: 'Khi bị cám dỗ làm điều sai',
      text: 'Tôi đã giấu lời Chúa trong lòng tôi, Để tôi không phạm tội cùng Chúa.',
      audio: 'v-psa11911',
      // crows snatch the Word: round 1 short pieces, round 2 every single word
      pieces: ['Tôi đã', 'giấu', 'lời Chúa', 'trong lòng tôi,', 'Để tôi', 'không phạm tội', 'cùng Chúa.'],
      words: [
        { t: 'Tôi', near: ['Ta', 'Con'] }, { t: 'đã', near: ['sẽ', 'đều'] }, { t: 'giấu', near: ['giữ', 'ghi'] },
        { t: 'lời', near: ['luật', 'lệnh'] }, { t: 'Chúa', near: ['Cha', 'Ngài'] }, { t: 'trong', near: ['trên', 'tận'] },
        { t: 'lòng', near: ['lời', 'tay'] }, { t: 'tôi,', near: ['ta,', 'con,'] }, { t: 'Để', near: ['Đặng', 'Khiến'] },
        { t: 'tôi', near: ['ta', 'con'] }, { t: 'không', near: ['chẳng', 'khỏi'] }, { t: 'phạm', near: ['phạt', 'làm'] },
        { t: 'tội', near: ['lỗi', 'ác'] }, { t: 'cùng', near: ['với', 'cho'] }, { t: 'Chúa.', near: ['Cha.', 'Ngài.'] },
      ],
    },
  },

  // region = index into regions; Learn/Result/Map pick the background from bg
  levels: [
    { id: 'l1', region: 0, type: 'Runner', bg: 'bg-run', title: 'Lối Hẹp', verse: 'isa4031', hint: 'Chạy chọn đúng biển gỗ có cụm từ tiếp theo!' },
    { id: 'l2', region: 0, type: 'River', bg: 'bg-river', title: 'Qua Đầm Lầy', verse: 'psa402', hint: 'Nhảy lên đúng hòn đá trước khi bùn dâng!' },
    { id: 'l3', region: 0, type: 'Lantern', bg: 'bg-night', title: 'Đường Đêm', verse: 'mat1128', hint: 'Thắp từng chiếc đèn bằng từ đúng!' },
    { id: 'boss', region: 0, type: 'Boss', bg: 'bg-boss', title: 'Bùn Buồn', verses: ['isa4031', 'psa402', 'mat1128'], hint: 'Dùng Lời Chúa làm gươm!' },
    { id: 'l4', region: 1, type: 'Catch', bg: 'bg-sinai', title: 'Núi Sấm Sét', verse: 'prv35', hint: 'Chạy hứng đúng cuộn chữ tiếp theo, né đá lửa!' },
    { id: 'l5', region: 1, type: 'Path', bg: 'bg-cliff', title: 'Đường Mây', verse: 'jhn146', hint: 'Chạm hoặc kéo đúng phiến đá để lát đường qua vực!' },
    { id: 'l6', region: 1, type: 'Archery', bg: 'bg-gate', title: 'Tháp Quạ', verse: 'psa11911', hint: 'Bắn trúng con quạ đang cướp chữ tiếp theo!' },
  ],

  // the boss's gloomy lies; each one is "weak" to one verse
  lies: [
    { verse: 'isa4031', text: 'Bạn mệt quá rồi... nằm xuống đây ngủ luôn đi...', audio: 'lie-isa4031' },
    { verse: 'psa402', text: 'Không ai kéo bạn ra khỏi đống bùn này đâu...', audio: 'lie-psa402' },
    { verse: 'mat1128', text: 'Gánh nặng quá... chẳng có chỗ nào để nghỉ đâu...', audio: 'lie-mat1128' },
  ],
};
