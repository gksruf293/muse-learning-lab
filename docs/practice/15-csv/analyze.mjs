import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// 이 실습의 CSV에는 따옴표·쉼표를 포함한 필드나 줄바꿈 필드가 없다.
// 일반 CSV 처리기로 사용하는 코드가 아니다.
export function analyze(text) {
  const lines = text.trimEnd().split(/\r?\n/);
  if (lines[0] !== 'date,lesson,minutes,completed') throw new Error('CSV 열 이름이 다르다.');
  const valid = [], errors = [];
  for (let i = 1; i < lines.length; i++) {
    const [date, lesson, rawMinutes, completed] = lines[i].split(',');
    // TODO: 빈 minutes, 음수, true/false가 아닌 completed를 오류로 분리한다.
    valid.push({date, lesson, minutes: Number(rawMinutes), completed: completed === 'true'});
  }
  const totalMinutes = valid.reduce((sum, row) => sum + row.minutes, 0);
  const completedCount = valid.filter(row => row.completed).length;
  return {
    validCount: valid.length, errors, totalMinutes,
    averageMinutes: valid.length ? totalMinutes / valid.length : null,
    completedCount, completionRate: valid.length ? completedCount / valid.length : null
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(analyze(readFileSync(new URL('./study.csv', import.meta.url), 'utf8')), null, 2));
}
