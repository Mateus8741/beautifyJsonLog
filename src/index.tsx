export function BeautifyJsonLog(title: string, obj: any) {
  const bold = '\x1b[1m';
  const green = '\x1b[32m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const blue = '\x1b[34m';
  const magenta = '\x1b[35m';
  const red = '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(`\n${bold}${green}🔍 ${title}${reset}`);

  const jsonString = JSON.stringify(obj, null, 2);

  const colorized = jsonString.replace(/^(\s*)"(.*?)": (.*)/gm, (_, space, key, value) => {
    let coloredValue = value.trim();

    try {
      if (coloredValue === 'null') {
        coloredValue = `${red}null${reset}`;
      } else if (coloredValue === 'true' || coloredValue === 'false') {
        coloredValue = `${magenta}${coloredValue}${reset}`;
      } else if (/^["]/.test(coloredValue)) {
        coloredValue = `${blue}${coloredValue}${reset}`;
      } else if (!isNaN(Number(coloredValue))) {
        coloredValue = `${yellow}${coloredValue}${reset}`;
      } else if (coloredValue.startsWith('[') && coloredValue.endsWith(']')) {
        const parsed = JSON.parse(coloredValue);
        if (Array.isArray(parsed)) {
          const isNum = parsed.every((i) => typeof i === 'number');
          const isStr = parsed.every((i) => typeof i === 'string');
          const arrStr = JSON.stringify(parsed, null, 2).replace(/\n/g, `\n${space}  `);
          if (isNum) {
            coloredValue = `${yellow}${arrStr}${reset}`;
          } else if (isStr) {
            coloredValue = `${blue}${arrStr}${reset}`;
          } else {
            coloredValue = `${cyan}${arrStr}${reset}`;
          }
        }
      } else {
        coloredValue = `${cyan}${coloredValue}${reset}`;
      }
    } catch {
      coloredValue = `${cyan}${coloredValue}${reset}`;
    }

    return `${space}${green}"${key}"${reset}: ${coloredValue}`;
  });

  console.log(colorized);
}
