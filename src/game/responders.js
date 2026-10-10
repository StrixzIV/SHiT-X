// Who takes the case at each FX level. Lower levels pass it up the chain.
// Links go to websites only — never real hotlines — so the joke can't cause prank calls.
export const RESPONDERS = [
  { org: 'แม่', who: 'Mom HQ', reply: 'ปลอดภัยก็ดี กินข้าวยัง', eta: 'ทันที', action: null },
  { org: 'ช่างไฟปากซอย', who: 'Local Electrician', reply: 'เดี๋ยวไปครับ (ไม่ไป) ซื้อเทปพันสายไฟมาพันเองก่อนนะ', eta: '3–5 วันทำการ', action: ['สั่งเทปพันสายไฟ ฿15', 'https://shopee.co.th/search?keyword=เทปพันสายไฟ'] },
  { org: 'การไฟฟ้า (กฟน. / กฟภ.)', who: 'Electricity Authority', reply: 'ได้รับเรื่องแล้ว ท่านเป็นคิวที่ 4,812 กรุณาถือสายรอ', eta: 'หลังน้ำลด', action: ['ดูข้อมูลการไฟฟ้า', 'https://th.wikipedia.org/wiki/การไฟฟ้านครหลวง'] },
  { org: 'กรมป้องกันและบรรเทาสาธารณภัย', who: 'DDPM', reply: 'ส่งเรือไปแล้ว แต่เรือก็นำไฟฟ้าเหมือนกัน', eta: '2 ชั่วโมง (ถ้าเรือไม่ช็อต)', action: ['ดูข้อมูล ปภ.', 'https://th.wikipedia.org/wiki/กรมป้องกันและบรรเทาสาธารณภัย'] },
  { org: 'กองทัพ — กรมทหารช่าง', who: 'Army Engineers', reply: 'ส่งรถ GMC บรรทุกเทปพันสายไฟ 1 ตัน กำลังเดินทาง', eta: 'รอคำสั่ง', action: ['ดูข้อมูลทหารช่าง', 'https://th.wikipedia.org/wiki/กรมการทหารช่าง'] },
  { org: 'สหประชาชาติ (UN)', who: 'United Nations', reply: 'คณะมนตรีความมั่นคงออกแถลงการณ์ "กังวลอย่างยิ่ง" ต่อหัวชาร์จของท่าน', eta: 'หลังประชุม 3 สมัย', action: ['ดูเว็บไซต์ UN', 'https://www.un.org'] },
  { org: 'NASA + IAEA', who: 'Space & Atomic Agencies', reply: 'ดาวเทียมตรวจพบจุดร้อนในซอยของท่าน ขอให้ถอดปลั๊กอย่างสุภาพ', eta: 'ยิงจรวดมาแล้ว', action: ['ดูเว็บไซต์ NASA', 'https://www.nasa.gov'] },
  { org: 'เบื้องบน', who: 'The Creator', reply: 'รับเรื่องแล้ว จะจัดน้ำท่วมให้ใหม่ในจักรวาลถัดไป', eta: 'นิรันดร์', action: ['ติดต่อเบื้องบน (บทสวด 7 คัมภีร์)', 'https://www.youtube.com/results?search_query=สวดพระอภิธรรม+7+คัมภีร์'] },
]
