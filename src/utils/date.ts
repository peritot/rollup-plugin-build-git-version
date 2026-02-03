import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * timezone
 */
const tz = 'Asia/Shanghai';

/**
 * format date to string
 * @param date
 * @returns
 */
export const dateToStr = (str?: string, timezone = tz): string => {
  const date = dayjs(str);
  return dayjs.tz(date, timezone).format('YYYY-MM-DD HH:mm:ss');
};
