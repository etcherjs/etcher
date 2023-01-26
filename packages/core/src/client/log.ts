export const log = (...message: any[]) => {
    console.log('%cetcher:%c', 'color: hsl(235, 89%, 72%); font-weight: 600', '', ...message);
};

export const error = (...message: any[]) => {
    console.error('%cetcher:%c', 'color: hsl(350, 89%, 72%); font-weight: 600', '', ...message);
};

export const warn = (...message: any[]) => {
    console.warn('%cetcher:%c', 'color: hsl(40, 89%, 72%); font-weight: 600', '', ...message);
};
