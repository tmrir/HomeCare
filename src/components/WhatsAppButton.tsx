import React from 'react';
import styled from 'styled-components';

// Styled component for better mobile and desktop support
const WhatsAppLink = styled.a`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  background-color: #25D366;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  text-decoration: none;
  
  &:hover, &:focus {
    background-color: #128C7E;
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    width: 56px;
    height: 56px;
    bottom: 16px;
    right: 16px;
  }
  
  @media (max-width: 480px) {
    width: 52px;
    height: 52px;
    bottom: 12px;
    right: 12px;
  }
`;

const WhatsAppIcon = styled.svg`
  width: 30px;
  height: 30px;
  
  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
  }
`;

const WhatsAppButton = () => {
  // CHANGE THIS TO YOUR WHATSAPP NUMBER (with country code, no + or spaces)
  const phoneNumber = '966547516692';
  const message = 'مرحباً، أحتاج إلى مساعدة بخصوص الخدمات المنزلية';
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <WhatsAppLink 
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا على واتساب"
      title="تواصل معنا على واتساب"
    >
      <WhatsAppIcon 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="white"
        aria-hidden="true"
      >
        <path d="M17.498 14.382v-.002c-.301-.15-1.767-.867-2.04-.966-.274-.099-.473-.149-.673.15-.197.295-.771.96-.94 1.161-.173.199-.347.223-.644.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.762-1.66-2.06-.173-.297-.018-.458.13-.606.136-.135.299-.352.448-.525.147-.15.199-.255.298-.45.1-.195.05-.367-.025-.525-.075-.15-.673-1.62-.922-2.207-.24-.584-.487-.51-.673-.517-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.36-.272.3-1.04 1.02-1.04 2.475s1.07 2.865 1.218 3.075c.15.195 2.104 3.195 5.1 4.485.71.3 1.262.48 1.694.615.714.226 1.36.195 1.87.12.57-.09 1.76-.72 2.006-1.425.248-.705.248-1.305.173-1.425-.074-.135-.27-.21-.57-.36m-5.446 7.443h-.016a9.87 9.87 0 01-5.031-1.38l-.36-.215-3.75.975 1.005-3.645-.239-.375a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.3A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.55 4.14 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.723 1.47h.005c6.554 0 11.89-5.335 11.89-11.893 0-3.18-1.26-6.19-3.548-8.452"/>
      </WhatsAppIcon>
    </WhatsAppLink>
  );
};

export default WhatsAppButton;
