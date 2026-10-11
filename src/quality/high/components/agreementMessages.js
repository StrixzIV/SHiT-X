export const READ_FIRST_MESSAGES = [
  'อ่านก่อนโว้ย! กากบาทมีไว้ปิดหน้าต่าง ไม่ได้มีไว้ปิดสมอง',
  'ใจเย็นพ่อคนไว! ข้อความยังไม่ทันเข้าหัว มือไปถึงกากบาทแล้ว',
  'อ่านก่อนสิวะ! นี่ข้อตกลง ไม่ใช่โฆษณาที่กดข้ามได้',
  'กดปิดเก่งขนาดนี้ อ่านเก่งด้วยไหม? กลับไปอ่านก่อน',
  'ระบบตรวจพบความไวของนิ้วสูงกว่าความไวในการอ่าน กรุณาปรับสมดุล',
  'ไม่ต้องหาทางลัด! น้ำท่วมก็เรื่องหนึ่ง ไม่อ่านก็อีกเรื่องหนึ่ง',
  'กากบาทไม่ใช่คำว่า “อ่านแล้ว” เลิกเนียนแล้วกลับไปอ่าน',
  'ตัวหนังสือไม่ได้กัด! อ่านให้จบก่อนจะทำตัวเป็นฟิวส์',
  'สายชาร์จมี 24 พิน แต่สติท่านเหลือกี่พิน? อ่านก่อน!',
  'จะรีบไปไหน? อ่านคำเตือนให้จบก่อน น้ำท่วมยังรออยู่',
  'กดปิดอีกแล้ว! ถ้านิ้วไวขนาดนี้ ลองเลื่อนตาอ่านบ้าง',
  'อ่านไม่ครบ ยังจบไม่ได้! ระบบไม่ได้มีไว้ให้ท่านสปีดรัน',
]

// Share one shuffled pool across all five warnings and the final consent.
export function createReadFirstPicker() {
  let pool = []
  let last
  return () => {
    if (!pool.length) {
      pool = [...READ_FIRST_MESSAGES]
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const message = pool[i]
        pool[i] = pool[j]
        pool[j] = message
      }
      if (pool[pool.length - 1] === last) {
        const message = pool[0]
        pool[0] = pool[pool.length - 1]
        pool[pool.length - 1] = message
      }
    }
    last = pool.pop()
    return last
  }
}
