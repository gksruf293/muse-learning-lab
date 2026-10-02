// 화면 검색·입력 오류를 위한 순수 함수. 공개 저장 형식은 core.mjs에서 검증합니다.
export function filterLessons(lessons, query) {
  const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase('ko-KR');
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return lessons.filter(lesson => {
    const text = normalize(`${lesson.tag} ${lesson.title} ${lesson.goal}`);
    return words.every(word => text.includes(word));
  });
}

export function validationErrors(fields) {
  return fields.flatMap(({id, label, value, required, max, type}) => {
    let message;
    if (required && !value.trim()) message = `${label}을 입력해 주세요.`;
    else if (max && value.length > max) message = `${label}은 ${max.toLocaleString('ko-KR')}자 이내로 적어 주세요.`;
    else if (value && type === 'date') {
      const date = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) message = '올바른 학습 날짜를 선택해 주세요.';
    } else if (value && type === 'https') {
      try { if (new URL(value.trim()).protocol !== 'https:') throw new Error(); }
      catch { message = 'https://로 시작하는 올바른 공개 자료 링크를 입력해 주세요.'; }
    }
    return message ? [{id, message}] : [];
  });
}
