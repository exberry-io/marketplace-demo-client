import { trigger, state, style, animate, transition, animateChild, query, group, stagger } from '@angular/animations';




export const zoomOutAnimation = trigger('zoomOutAnimation', [
    transition(':leave', [
        query('.expanded', [
            animateChild()
        ], { optional: true }),
        animate('400ms 0ms ease-in', style({ transform: 'scale(0)' }))
    ]),
]);


export const parentAnimationDelay = trigger('parentAnimationDelay', [
    transition(':enter', [
        animate('0ms 500ms')
    ])
]);


export const slideIn = trigger('slideIn', [
    state('*', style({
        transform: 'translateX(100%)',
    })),
    state('in', style({
        transform: 'translateX(0)',
    })),
    state('out', style({
        transform: 'translateX(-100%)',
    })),
    transition('* => in', animate('600ms ease-in')),
    transition('in => out', animate('600ms ease-in'))
]);




export const routerTransition = trigger('routerTransition', [
    transition(':enter', [
        style({ opacity: '0', transform: 'translateY(0)' }),
        animate('300ms 0ms  ease-in', style({ transform: 'translateY(0)', opacity: '1' }))
    ]),
    //transition(':leave', [
    //    style({ 'background-color':'#fff', boxShadow: '1px 1px 5px 3px rgba(0,0,0,0.1)' }),
    //    animate('300ms 0ms', style({ transform: 'translateZ(-60px) translateX(100%)' }))
    //]),
]);

/*
export const routerTransition = trigger('routerTransition', [
    transition(':enter', [
        style({ boxShadow: '1px 1px 5px 3px rgba(0,0,0,0.1)', transform: 'perspective(10px) translateZ(-200px)' }),
        animate('400ms 0ms', style({ transform: 'translateZ(0)' }))
    ]),
    transition(':leave', [
        style({ 'background-color':'#fff', boxShadow: '1px 1px 5px 3px rgba(0,0,0,0.1)' }),
        animate('300ms 0ms', style({ transform: 'translateZ(-60px) translateX(100%)' }))
    ]),
]);
*/
