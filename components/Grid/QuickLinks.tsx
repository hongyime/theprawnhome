
import React from 'react';
import { Card } from '../UI/Card';
import { QUICK_LINKS } from '../../constants';

export const QuickLinks: React.FC = () => {
  return (
    <Card colSpan="md:col-span-1 md:row-span-2" className="!p-0 flex flex-col">
      <div className="p-4 bg-black text-white border-b-2 border-black">
        <h3 className="font-bold text-lg">QUICK_JUMP_V1</h3>
      </div>
      <div className="flex-grow flex flex-col">
        {QUICK_LINKS.map((link, index) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
                flex-grow flex items-center justify-between px-6 py-4
                border-b-2 border-black last:border-b-0
                hover:bg-prawn hover:text-black
                transition-[color,background-color,transform,opacity] duration-200 group
            `}
          >
            <span className="font-bold text-lg">{link.name}</span>
            <span className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-[color,background-color,transform,opacity] duration-200">
                →
            </span>
          </a>
        ))}
      </div>
    </Card>
  );
};
