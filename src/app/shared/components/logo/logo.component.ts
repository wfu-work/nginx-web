import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'logo',
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      role="img"
      aria-label="Nginx Control logo"
    >
      <defs>
        <linearGradient
          id="nginxBadgeRim"
          x1="178"
          y1="128"
          x2="846"
          y2="896"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="var(--nginx-logo-primary)" />
          <stop offset=".5" stop-color="var(--nginx-logo-active)" />
          <stop offset="1" stop-color="var(--nginx-logo-active)" />
        </linearGradient>
        <linearGradient
          id="nginxBadgeCore"
          x1="262"
          y1="164"
          x2="740"
          y2="858"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="var(--nginx-logo-core-start)" />
          <stop offset=".54" stop-color="#0c1719" />
          <stop offset="1" stop-color="#08100f" />
        </linearGradient>
        <linearGradient
          id="nginxBadgeLime"
          x1="274"
          y1="760"
          x2="756"
          y2="260"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="var(--nginx-logo-accent)" />
          <stop offset=".56" stop-color="var(--nginx-logo-primary)" />
          <stop offset="1" stop-color="var(--nginx-logo-accent)" />
        </linearGradient>
        <linearGradient
          id="nginxBadgeArc"
          x1="296"
          y1="640"
          x2="744"
          y2="278"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="var(--nginx-logo-primary)" />
          <stop offset=".45" stop-color="var(--nginx-logo-accent)" />
          <stop offset="1" stop-color="var(--nginx-logo-accent)" />
        </linearGradient>
        <linearGradient
          id="nginxBadgeServer"
          x1="286"
          y1="296"
          x2="654"
          y2="728"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#fffdf0" />
          <stop offset=".54" stop-color="#f4f1de" />
          <stop offset="1" stop-color="#d6d5c6" />
        </linearGradient>
        <linearGradient
          id="nginxBadgeServerSide"
          x1="352"
          y1="390"
          x2="754"
          y2="728"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="1" stop-color="#c8c9bb" />
        </linearGradient>
        <radialGradient id="nginxBadgeLight" cx="36%" cy="18%" r="78%">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".12" />
          <stop offset=".6" stop-color="#ffffff" stop-opacity=".04" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <filter
          id="nginxBadgeDepth"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          color-interpolation-filters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="26"
            stdDeviation="20"
            flood-color="var(--nginx-logo-active)"
            flood-opacity=".34"
          />
          <feDropShadow
            dx="0"
            dy="5"
            stdDeviation="5"
            flood-color="var(--nginx-logo-accent)"
            flood-opacity=".15"
          />
        </filter>
        <filter
          id="nginxBadgeSoftShadow"
          x="-24%"
          y="-24%"
          width="148%"
          height="148%"
          color-interpolation-filters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="20"
            stdDeviation="16"
            flood-color="#020807"
            flood-opacity=".42"
          />
        </filter>
      </defs>

      <g transform="translate(512 512) scale(1.2 .91) translate(-512 -512)">
        <g filter="url(#nginxBadgeDepth)">
          <path d="M512 74 838 262v500L512 950 186 762V262Z" fill="url(#nginxBadgeRim)" />
          <path d="M512 116 802 284v456L512 908 222 740V284Z" fill="url(#nginxBadgeCore)" />
          <path
            d="M512 150 772 300v424L512 874 252 724V300Z"
            fill="none"
            stroke="url(#nginxBadgeLime)"
            stroke-width="18"
            stroke-linejoin="round"
          />
          <path d="M512 116 802 284v456L512 908 222 740V284Z" fill="url(#nginxBadgeLight)" />
        </g>

        <g opacity=".96">
          <path
            d="M470 194 512 236 470 278"
            fill="none"
            stroke="var(--nginx-logo-accent)"
            stroke-width="20"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M544 252h42"
            fill="none"
            stroke="var(--nginx-logo-accent)"
            stroke-width="15"
            stroke-linecap="round"
          />
          <path
            d="M234 462c-24 0-28 16-28 40v20c0 20-11 32-28 32 17 0 28 12 28 32v20c0 24 4 40 28 40"
            fill="none"
            stroke="var(--nginx-logo-accent)"
            stroke-width="18"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M790 462c24 0 28 16 28 40v20c0 20 11 32 28 32-17 0-28 12-28 32v20c0 24-4 40-28 40"
            fill="none"
            stroke="var(--nginx-logo-accent)"
            stroke-width="18"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>

        <g filter="url(#nginxBadgeSoftShadow)">
          <path
            d="M328 630c36-148 125-240 236-240 104 0 178 86 178 214v66"
            fill="none"
            stroke="#06120f"
            stroke-width="104"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity=".5"
          />
          <path
            d="M326 622c42-148 128-238 238-238 104 0 176 86 176 216v62"
            fill="none"
            stroke="url(#nginxBadgeArc)"
            stroke-width="92"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M326 622c42-148 128-238 238-238 104 0 176 86 176 216"
            fill="none"
            stroke="var(--nginx-logo-accent)"
            stroke-width="28"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity=".34"
          />
        </g>

        <g filter="url(#nginxBadgeSoftShadow)">
          <path d="M302 304 398 250l74 42v348l-74 52-96-55Z" fill="#d8d8c9" />
          <path d="M302 304 398 250l74 42-96 56Z" fill="#fffef2" />
          <path d="M302 304 376 348v344l-74-55Z" fill="url(#nginxBadgeServer)" />
          <path d="M376 348 472 292v348l-96 52Z" fill="url(#nginxBadgeServerSide)" />
          <path
            d="M328 408l70 38M328 456l70 38M328 504l70 38"
            fill="none"
            stroke="var(--nginx-logo-active)"
            stroke-width="15"
            stroke-linecap="round"
          />
          <circle cx="354" cy="594" r="17" fill="var(--nginx-logo-active)" />
          <circle cx="354" cy="644" r="17" fill="var(--nginx-logo-active)" />
          <circle cx="354" cy="694" r="18" fill="var(--nginx-logo-primary)" />

          <path d="M654 438 732 394l70 40v238l-70 48-78-45Z" fill="#d8d8c9" />
          <path d="M654 438 732 394l70 40-78 46Z" fill="#fffef2" />
          <path d="M654 438 724 480v240l-70-45Z" fill="url(#nginxBadgeServer)" />
          <path d="M724 480 802 434v238l-78 48Z" fill="url(#nginxBadgeServerSide)" />
          <path
            d="M690 530l56-30M690 578l56-30"
            fill="none"
            stroke="var(--nginx-logo-active)"
            stroke-width="15"
            stroke-linecap="round"
          />
          <circle cx="712" cy="628" r="15" fill="var(--nginx-logo-active)" />
          <circle cx="712" cy="674" r="15" fill="var(--nginx-logo-active)" />
          <circle cx="712" cy="720" r="16" fill="var(--nginx-logo-primary)" />
        </g>

        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path
            d="M286 738h76c28 0 32 34 46 44h136"
            stroke="var(--nginx-logo-circuit)"
            stroke-width="13"
          />
          <path
            d="M738 738h-76c-28 0-32 34-46 44H480"
            stroke="var(--nginx-logo-circuit)"
            stroke-width="13"
          />
          <path d="M512 796v70" stroke="var(--nginx-logo-circuit)" stroke-width="13" />
          <circle cx="286" cy="738" r="20" stroke="var(--nginx-logo-circuit)" stroke-width="13" />
          <circle cx="738" cy="738" r="20" stroke="var(--nginx-logo-circuit)" stroke-width="13" />
          <circle cx="512" cy="866" r="20" stroke="var(--nginx-logo-circuit)" stroke-width="13" />
        </g>

        <g fill="var(--nginx-logo-accent)">
          <circle cx="386" cy="748" r="11" />
          <circle cx="414" cy="748" r="11" />
          <circle cx="442" cy="748" r="11" />
          <circle cx="470" cy="748" r="11" />
          <circle cx="554" cy="748" r="11" />
          <circle cx="582" cy="748" r="11" />
          <circle cx="610" cy="748" r="11" />
          <circle cx="638" cy="748" r="11" />
        </g>

        <g filter="url(#nginxBadgeSoftShadow)">
          <path d="M512 704 558 730v54l-46 27-46-27v-54Z" fill="url(#nginxBadgeLime)" />
          <path d="M512 724 540 740v32l-28 17-28-17v-32Z" fill="var(--nginx-logo-active)" />
          <circle cx="740" cy="808" r="46" fill="var(--nginx-logo-active)" />
          <circle cx="740" cy="808" r="28" fill="var(--nginx-logo-accent)" />
        </g>
      </g>
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        flex: 0 0 auto;
        aspect-ratio: 1;
        --nginx-logo-primary: var(--nm-primary, #07572e);
        --nginx-logo-accent: var(--nm-primary-hover, #9fd72f);
        --nginx-logo-active: var(--nm-primary-active, #10251c);
        --nginx-logo-circuit: var(--nm-primary, #47794a);
        --nginx-logo-core-start: var(--nm-primary-active, #142321);
      }

      svg {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {}
