import { ImageResponse } from 'next/og';
import { getYearsOfExperience } from '@/lib/experience';

export const runtime = 'edge';
export const alt = 'Tran Ngoc Hai — Senior Fullstack Developer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#000000',
          color: '#F5F5F4',
          fontFamily: 'serif',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
          }}
        >
          <span style={{ color: '#7DD3C8' }}>Senior Fullstack Developer</span>
          <span style={{ color: '#8A8A87' }}>HCMC · VN</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: '128px',
              lineHeight: 0.9,
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            Tran Ngoc Hai
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '22px',
              color: '#8A8A87',
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '40px',
                height: '1px',
                background: '#7DD3C8',
              }}
            />
            <span>
              {getYearsOfExperience()}+ years · FinTech · HealthTech · SaaS
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            color: '#767676',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
          }}
        >
          <span>Dalmore · Nestwell · Zeligate · Trailer2you</span>
          <span>topy-tran.vercel.app</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
