-- Gerado por scripts/gerar-seed.mjs a partir de ESTOQUE ATUAL.txt + pesquisa
-- Aplicado DEPOIS do schema.sql (só funciona com a tabela vazia).

do $$ begin
  if exists (select 1 from public.produtos) then
    raise exception 'A tabela produtos já tem dados — seed não aplicado.';
  end if;
end $$;

insert into public.produtos (codigo, nome, nome_original, marca, modelo, categoria, condicao, quantidade, para_venda, canal, status, observacoes, titulo_ml, titulo_olx, descricao, ficha_tecnica, palavras_chave, categoria_ml, categoria_olx, conteudo_embalagem, garantia, gtin, peso_kg, altura_cm, largura_cm, comprimento_cm, preco_sugerido, preco_min, preco_max, fontes, confianca, pendencias) values
  (1, 'Modem Óptico ONT GPON Wi-Fi 6 Intelbras AX 3000V', 'MODEM ÓPTICO PON LAN 4P FXS 2P USB 1P - wifiber ax3000v', 'Intelbras', 'ONT AX 3000V (WiFiber AX 3000V)', 'Redes', 'novo', 5, false, 'nenhum', 'somente_estoque', 'Estoque apenas, não venda', 'Ont Gpon Wi-fi 6 Intelbras Ax 3000v 4 Portas Giga 2 Fxs', 'ONT GPON Wi-Fi 6 Intelbras AX 3000V 4 portas Gigabit 2 FXS USB', 'Modem óptico ONT GPON Intelbras AX 3000V, terminal de fibra com Wi-Fi 6 dual band, ideal para provedores de internet que buscam alto desempenho na casa do assinante.
Principais recursos:
- Wi-Fi 6 AX3000: até 576 Mbps em 2,4 GHz e até 2400 Mbps em 5 GHz
- 4 portas LAN Gigabit RJ45
- 2 portas FXS para telefonia VoIP
- 1 porta USB
- Interface GPON SC/APC padrão ITU-T G.984, óptica Classe B+
- Suporte a até 10 SSIDs
- PPPoE, NAT, DHCP e IGMP v2/v3 snooping para IPTV
- Gerenciamento remoto via TR-069 (Remotize) e pela OLT
Especificações técnicas:
Interface óptica GPON SC/APC; fonte externa 12 V / 2 A; consumo de 24 W; temperatura de operação de 0 a 40 °C; peso aproximado de 350 g.
Conteúdo da embalagem:
ONT AX 3000V e fonte de alimentação.
Indicação de uso:
Provedores de internet via fibra óptica (FTTH) e instalações residenciais ou empresariais que precisam de Wi-Fi 6 e telefonia VoIP integrada.
Condição: produto novo.
Item mantido em estoque para uso próprio.', '{"Tecnologia":"GPON (ITU-T G.984)","Conector óptico":"SC/APC","Classe óptica":"B+","Wi-Fi":"Wi-Fi 6 AX3000 dual band (576 Mbps 2,4 GHz + 2400 Mbps 5 GHz)","SSIDs":"Até 10","Portas LAN":"4 x Gigabit RJ45","Portas FXS":"2","USB":"1","Alimentação":"Fonte externa 12 V / 2 A","Consumo":"24 W","Temperatura de operação":"0 a 40 °C","Peso":"350 g","Gerenciamento":"TR-069 (Remotize), OMCI via OLT"}'::jsonb, array['ont gpon', 'intelbras ax 3000v', 'wifiber ax3000', 'modem fibra wifi 6', 'ont wifi 6', 'onu gpon voip', 'roteador fibra optica']::text[], 'Informática > Conectividade e Redes > Modems', 'Eletrônicos e celulares > Computadores e acessórios', '1 ONT AX 3000V, 1 fonte de alimentação', '1 ano de garantia do fabricante', null, 0.8, 8, 22, 28, null, null, null, array['https://backend.intelbras.com/sites/default/files/2024-01/datasheet-ont-ax3000v-pt.pdf', 'https://backend.intelbras.com/en/pon-lan-4p-optical-modem-fxs-2p-usb-1p-ax-3000v-ont-ax3000v']::text[], 'alta', 'Não vender (somente estoque). Produto consta como descontinuado no site Intelbras.'),
  (2, 'Terminal XPON VoIP Wireless AC1200 TP-Link XC220-G3v', 'XC220-G3v Terminal XPON VolP Wireless AC1200', 'TP-Link', 'XC220-G3v', 'Redes', 'novo', 3, false, 'nenhum', 'somente_estoque', 'Estoque apenas, não venda', 'Onu Xpon Tp-link Xc220-g3v Ac1200 Dual Band Voip', 'ONU XPON TP-Link XC220-G3v Wi-Fi AC1200 Dual Band com VoIP', 'Terminal óptico XPON TP-Link XC220-G3v com Wi-Fi AC1200 dual band e porta de telefonia VoIP, solução completa para conexões de fibra óptica.
Principais recursos:
- Compatível com GPON e EPON (XPON)
- Wi-Fi dual band AC1200: 300 Mbps em 2,4 GHz e 867 Mbps em 5 GHz
- 4 portas LAN Gigabit RJ45
- 1 porta FXS RJ11 para telefone analógico via VoIP
- 2 antenas externas dual band
- Gerenciamento remoto via OMCI e TR-069
- VLAN, firewall, QoS, DMZ, controle parental, DDNS, VPN passthrough e IPv6
Especificações técnicas:
GPON ITU-T G.984/G.988 com até 2,488 Gbps de download e 1,244 Gbps de upload; 1 porta PON SC/APC; fonte 12 V / 1 A; dimensões aproximadas de 218 x 155 x 37 mm; operação de 0 a 40 °C.
Conteúdo da embalagem:
Terminal XC220-G3v e fonte de alimentação.
Indicação de uso:
Provedores de internet FTTH e usuários que precisam de Wi-Fi e telefonia em um único equipamento.
Condição: produto novo.
Item mantido em estoque para uso próprio.', '{"Tecnologia":"XPON (GPON/EPON)","Padrões GPON":"ITU-T G.984 / G.988","Taxa PON":"2,488 Gbps down / 1,244 Gbps up","Wi-Fi":"AC1200 dual band (300 Mbps 2,4 GHz + 867 Mbps 5 GHz)","Portas LAN":"4 x Gigabit RJ45","Porta FXS":"1 x RJ11","Porta PON":"1 x SC/APC","Antenas":"2 externas dual band","Alimentação":"12 V / 1 A","Dimensões":"218 x 155 x 37 mm","Gerenciamento":"OMCI, TR-069"}'::jsonb, array['xc220-g3v', 'onu xpon', 'tp-link xpon', 'ont ac1200', 'onu gpon voip', 'roteador fibra tp-link', 'onu dual band']::text[], 'Informática > Conectividade e Redes > Modems', 'Eletrônicos e celulares > Computadores e acessórios', '1 terminal XC220-G3v, 1 fonte de alimentação', 'Garantia do fabricante', null, 0.7, 7, 20, 27, null, null, null, array['https://www.tp-link.com/br/service-provider/wifi-router/xc220-g3v', 'https://www.tp-link.com/uy/products/details/xc220-g3v.html']::text[], 'alta', 'Não vender (somente estoque).'),
  (3, 'Terminal GPON Wi-Fi 6 AX3000 VoIP TP-Link XX530v', 'Moldem XX530v', 'TP-Link', 'XX530v', 'Redes', 'novo', 5, false, 'nenhum', 'somente_estoque', 'Estoque apenas, não venda', 'Onu Gpon Wi-fi 6 Tp-link Xx530v Ax3000 Voip', 'ONU GPON Wi-Fi 6 TP-Link XX530v AX3000 com VoIP', 'Terminal óptico GPON TP-Link XX530v com Wi-Fi 6 AX3000 e porta VoIP, indicado para provedores que desejam entregar velocidade e cobertura de última geração ao assinante.
Principais recursos:
- Wi-Fi 6 AX3000: 2402 Mbps em 5 GHz e 574 Mbps em 2,4 GHz
- MU-MIMO, OFDMA uplink e downlink e beamforming
- Compatível com EasyMesh para redes mesh
- 4 portas LAN Gigabit
- 1 porta FXS RJ11 com suporte a contas SIP
- 1 porta PON SC/APC
- Gerenciamento remoto TR-069/TR-369 e OMCI
Especificações técnicas:
Interface GPON SC/APC; Wi-Fi 6 dual band AX3000; 4 portas Gigabit Ethernet; 1 FXS.
Conteúdo da embalagem:
Terminal XX530v e fonte de alimentação.
Indicação de uso:
Instalações FTTH residenciais e empresariais de alta velocidade com telefonia VoIP.
Condição: produto novo.
Item mantido em estoque para uso próprio.', '{"Tecnologia":"GPON","Wi-Fi":"Wi-Fi 6 AX3000 (2402 Mbps 5 GHz + 574 Mbps 2,4 GHz)","Recursos Wi-Fi":"MU-MIMO, OFDMA, Beamforming, EasyMesh","Portas LAN":"4 x Gigabit","Porta FXS":"1 x RJ11 (SIP)","Porta PON":"1 x SC/APC","Gerenciamento":"TR-069, TR-369, OMCI"}'::jsonb, array['xx530v', 'onu gpon wifi 6', 'tp-link ax3000 gpon', 'ont wifi 6', 'onu voip', 'modem fibra tp-link']::text[], 'Informática > Conectividade e Redes > Modems', 'Eletrônicos e celulares > Computadores e acessórios', '1 terminal XX530v, 1 fonte de alimentação', 'Garantia do fabricante', null, 0.9, 8, 22, 28, null, null, null, array['https://service-provider.tp-link.com/es/gpon/xx530v', 'https://www.tp-link.com/cac/products/details/xx530v.html']::text[], 'alta', 'Não vender (somente estoque). Nome original ''Moldem XX530v'' interpretado como TP-Link XX530v.'),
  (4, 'Gateway de Voz IP Intelbras GW 304 O 4 Portas FXO', 'INTELBRAS GW 304 O gateway', 'Intelbras', 'GW 304 O', 'Telefonia', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Gateway De Voz Ip Intelbras Gw 304 O 4 Portas Fxo Sip', 'Gateway de Voz IP Intelbras GW 304 O 4 portas FXO SIP - Novo', 'Gateway de voz IP Intelbras GW 304 O com 4 portas FXO, a solução para integrar linhas telefônicas analógicas a sistemas VoIP de forma simples e confiável.
Principais recursos:
- 4 portas FXO para conexão de linhas analógicas de operadora
- Integração de linhas analógicas a PABX IP, centrais virtuais e servidores SIP
- Protocolo SIP
- Suporte a IPv6
- Ideal para empresas de qualquer porte que querem migrar para VoIP sem abandonar as linhas atuais
- Produto homologado pela Anatel
Especificações técnicas:
Gateway de voz IP; 4 portas FXO; protocolo SIP; suporte a IPv6; código Intelbras 4340013.
Conteúdo da embalagem:
Gateway GW 304 O, fonte de alimentação e documentação.
Indicação de uso:
Escritórios, comércios, condomínios e empresas que utilizam PABX IP ou telefonia em nuvem e precisam conectar linhas fixas analógicas ao sistema VoIP, reduzindo custos e centralizando o atendimento.
Condição: produto novo.
Garanta já o seu e modernize a telefonia da sua empresa com a qualidade Intelbras.', '{"Tipo":"Gateway de voz IP","Portas FXO":"4","Protocolo":"SIP","IPv6":"Sim","Código do fabricante":"4340013","Homologação":"Anatel"}'::jsonb, array['gateway gw 304 o', 'gateway fxo intelbras', 'gateway voip 4 fxo', 'intelbras gw 304', 'gateway de voz ip', 'fxo sip', 'voip intelbras']::text[], 'Eletrônicos, Áudio e Vídeo > Telefonia > Telefonia VoIP > Gateways VoIP', 'Eletrônicos e celulares > Telefones e acessórios', '1 gateway GW 304 O, 1 fonte de alimentação, guia de instalação', '1 ano de garantia do fabricante', null, 1, 8, 25, 30, 1199, 1050, 1500, array['https://www.intelbras.com/pt-br/gateway-de-voz-gw-304-o', 'https://www.lojamundi.com.br/GW304-o-gateway-4fxo-intelbras', 'https://www.redeloja.com.br/produto/gateway-gw-304-o-intelbras-1738676809467.2']::text[], 'alta', 'Conferir conteúdo da embalagem (fonte/cabos) e se acompanha nota fiscal. Poucos anúncios no ML; preço baseado em lojas (R$ 1.269 Pix a R$ 1.881).'),
  (5, 'Central de Choque Eletrificador para Cerca Elétrica JFL ECR 18i Plus', 'Eletrificador para cerca ECR 18i Plus', 'JFL', 'ECR 18i Plus', 'Alarme e Sensores', 'usado', 1, false, 'nenhum', 'somente_estoque', 'Usado, não vender, só estoque', 'Central Choque Cerca Elétrica Jfl Ecr 18i Plus', 'Central de Choque Cerca Elétrica JFL ECR 18i Plus - Usado', 'Central de choque (eletrificador) para cerca elétrica JFL ECR 18i Plus, equipamento nacional para proteção perimetral de residências, comércios e condomínios.
Principais recursos:
- Eletrificador da linha ECR-18i da JFL Alarmes
- Energia de pulso de até 4 J, dentro do limite da norma IEC 60335-2-76
- Saída para monitoramento por central de alarme
- Armar e desarmar por controle remoto
- Alimentação 127/220 VCA com bateria de 12 VCC
Especificações técnicas:
Alimentação 127/220 VCA 60 Hz e 12 VCC (bateria); energia de pulso 4 J (linha ECR-18i); extensão máxima conforme manual do fabricante e bitola do fio.
Conteúdo:
Central de choque ECR 18i Plus.
Indicação de uso:
Cercas elétricas residenciais, comerciais e condominiais.
Condição: produto usado, testado e funcionando.
Item mantido em estoque para uso próprio.', '{"Fabricante":"JFL Alarmes","Tipo":"Central de choque / eletrificador de cerca","Energia de pulso":"4 J (linha ECR-18i)","Alimentação":"127/220 VCA 60 Hz e 12 VCC (bateria)","Norma":"IEC 60335-2-76"}'::jsonb, array['ecr 18i plus', 'central de choque jfl', 'eletrificador cerca eletrica', 'jfl ecr 18', 'cerca eletrica central', 'gerador de choque']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Cercas Elétricas > Centrais de Choque', 'Eletrônicos e celulares > Outros itens', '1 central de choque ECR 18i Plus', 'Sem garantia', null, 1.5, 10, 22, 28, null, null, null, array['https://descargas.fiesa.com.ar/descargas/JFL/Manual-ECR18_ECR18I_-SHOCK-18-esp-rev-01-1.pdf', 'https://m.magazineluiza.com.br/busca/central+jfl+ecr18/', 'https://www.kabum.com.br/produto/376951/central-de-choque-cerca-eletrica-ecr-18-plus-433-92mhz-18-000v-jfl']::text[], 'media', 'Não vender (somente estoque). Marca é JFL, não Intelbras. Confirmar na etiqueta se é ECR-18i Plus (4 J) ou ECR-18 Plus (0,5 J, sensores sem fio 433 MHz). Referência novo: R$ 398 a R$ 480.'),
  (6, 'Câmera Speed Dome (marca e modelo a confirmar) - Usada', 'Câmera Speed Dome usada', null, null, 'CFTV', 'usado', 1, true, 'olx', 'a_revisar', 'Marca/modelo não informados — conferir etiqueta', 'Câmera Speed Dome Usada', 'Câmera Speed Dome para CFTV - Usada', 'Câmera speed dome para sistemas de CFTV, com movimentação PTZ (pan, tilt e zoom) que permite acompanhar e ampliar pontos de interesse em grandes áreas a partir de um único equipamento.
Principais recursos:
- Movimentação horizontal e vertical motorizada (PTZ)
- Zoom para visualização de detalhes à distância
- Indicada para monitoramento de pátios, estacionamentos, galpões, condomínios e áreas externas
- Controle pelo gravador (DVR/NVR) ou software compatível
Especificações técnicas:
Marca, modelo, resolução, zoom óptico, tipo (IP ou analógica/HD) e alimentação devem ser conferidos na etiqueta do produto.
Conteúdo:
Câmera speed dome.
Indicação de uso:
Monitoramento de grandes áreas internas e externas em sistemas de segurança eletrônica.
Condição: produto usado, testado e funcionando.
Ótima oportunidade para ampliar seu sistema de CFTV com um equipamento profissional.', '{"Tipo":"Câmera Speed Dome (PTZ)"}'::jsonb, array['camera speed dome', 'speed dome usada', 'camera ptz', 'cftv speed dome', 'camera com zoom', 'speed dome ip']::text[], 'Eletrônicos, Áudio e Vídeo > Segurança para Casa > Câmeras de Segurança', 'Eletrônicos e celulares > Câmeras e acessórios', '1 câmera speed dome', 'Sem garantia', null, 3, 30, 25, 25, null, null, null, array['https://m.magazineluiza.com.br/busca/camera+speeddome/']::text[], 'baixa', 'Marca/modelo não informados: conferir etiqueta (marca, modelo, IP ou HD, resolução, zoom, alimentação) e acessórios (suporte, fonte). Sem isso não é possível precificar; speed domes variam de R$ 170 a R$ 6.700 novas.'),
  (7, 'Fonte de Alimentação (dados a confirmar)', 'Fontes (informações dela na foto)', null, null, 'Energia', 'novo', 2, true, 'mercado_livre', 'a_revisar', 'PENDENTE: dados estão em foto que não foi enviada', 'Fonte De Alimentação', 'Fonte de Alimentação - Nova', 'Fonte de alimentação nova, indicada para alimentar equipamentos eletrônicos de segurança, redes e telecomunicações.
Principais recursos:
- Produto novo
- Alimentação estável para equipamentos eletrônicos
- Indicada para instalações de CFTV, redes e controle de acesso
Especificações técnicas:
Marca, modelo, tensão de entrada, tensão e corrente de saída, potência e tipo de conector devem ser conferidos na etiqueta do produto antes da publicação deste anúncio.
Conteúdo da embalagem:
Fonte de alimentação.
Indicação de uso:
Alimentação de câmeras, roteadores, ONTs, controladores de acesso e demais equipamentos compatíveis com as especificações de saída da fonte.
Condição: produto novo, sem uso.
Antes de comprar, confira se a tensão e a corrente de saída são compatíveis com o seu equipamento. Confira as especificações e garanta a sua.', '{}'::jsonb, array['fonte de alimentação', 'fonte 12v', 'fonte chaveada', 'fonte cftv', 'fonte bivolt']::text[], 'Informática > Componentes para PC > Fontes de Alimentação', 'Eletrônicos e celulares > Outros itens', '1 fonte de alimentação', null, null, null, null, null, null, null, null, null, '{}'::text[], 'baixa', 'PENDENTE: dados estão em foto não enviada. Informar marca, modelo, entrada/saída (V/A/W) e conector para identificar e precificar. Descrição atual é genérica e não deve ser publicada sem atualizar.'),
  (8, 'Suporte para Catraca de Controlador Facial Intelbras SC 3000 UN', 'SC 3000 UN SUPORTE P/CONTROLADOR', 'Intelbras', 'SC 3000 UN', 'Controle de Acesso', 'novo', 2, true, 'mercado_livre', 'a_revisar', null, 'Suporte Catraca Controlador Facial Intelbras Sc 3000 Un', 'Suporte para Controlador Facial Intelbras SC 3000 UN - Novo', 'Suporte Intelbras SC 3000 UN para instalação de controladores de acesso faciais em catracas, garantindo fixação firme, acabamento profissional e posicionamento ideal para o reconhecimento facial.
Principais recursos:
- Suporte oficial Intelbras para controladores de acesso faciais
- Desenvolvido para instalação em catracas, como as linhas CAP 3000 e CAB 3000
- Compatível com diversos controladores faciais Intelbras, como SS 3540 MF FACE EX, SS 5530 MF FACE, SS 5530 MF FACE LITE, SS 7520 FACE T V2 e SS 7530 FACE V2
- Acompanha kit completo para instalação
- Posiciona o controlador na altura adequada para leitura facial
Especificações técnicas:
Tipo: suporte para catraca; código Intelbras 4680032; aplicação: controladores de acesso faciais Intelbras.
Conteúdo da embalagem:
Suporte SC 3000 UN e kit de instalação.
Indicação de uso:
Empresas, academias, condomínios, escolas e indústrias que utilizam catracas com controle de acesso por reconhecimento facial.
Condição: produto novo.
Confira a compatibilidade com o seu controlador e garanta uma instalação segura e organizada.', '{"Tipo":"Suporte para catraca de controlador facial","Código do fabricante":"4680032","Compatibilidade":"SS 3540 MF FACE EX, SS 5530 MF FACE, SS 5530 MF FACE LITE, SS 7520 FACE T V2, SS 7530 FACE V2 (entre outros)","Catracas":"CAP 3000 / CAB 3000","Acompanha":"Kit de instalação"}'::jsonb, array['sc 3000 un', 'suporte controlador facial', 'suporte catraca intelbras', 'suporte reconhecimento facial', 'intelbras sc 3000', 'suporte ss 3540', 'acessorio catraca']::text[], 'Segurança > Controle de Acesso > Acessórios', 'Eletrônicos e celulares > Outros itens', '1 suporte SC 3000 UN, kit de instalação', '1 ano de garantia do fabricante', null, 1.5, 10, 20, 40, 479, 450, 600, array['https://www.intelbras.com/pt-br/suporte-para-catraca-dos-controladores-faciais-sc-3000-un', 'https://www.mercadolivre.com.br/suporte-controle-acesso-facial-sc-3000-un-intelbras/p/MLB27119483', 'https://loja.oamix.com.br/produtos/detalhes/4680032/suporte-para-controle-de-acesso-facial-sc-3000-un-intelbras-pc/']::text[], 'alta', 'Conferir peso/dimensões reais da embalagem para frete.'),
  (9, 'Telefone IP de Parede Intelbras TDMI 400 IP PoE', 'TDMI 400 IP TELEFONE IP DE PAREDE', 'Intelbras', 'TDMI 400 IP', 'Telefonia', 'novo', 6, true, 'mercado_livre', 'a_revisar', null, 'Telefone Ip De Parede Intelbras Tdmi 400 Ip Poe Voip', 'Telefone IP de Parede Intelbras TDMI 400 IP PoE VoIP - Novo', 'Telefone IP de parede Intelbras TDMI 400 IP, que também funciona como interfone VoIP, ideal para portarias, condomínios, corredores, áreas comuns e ambientes corporativos.
Principais recursos:
- Telefone/interfone VoIP com protocolo SIP
- Alimentação PoE: pode ser alimentado diretamente por switch PoE
- Também pode ser alimentado por fonte com injetor PoE passivo (vendidos separadamente)
- Instalação em parede, economizando espaço
- Integra-se a centrais IP e PABX VoIP
- Homologado pela Anatel
Especificações técnicas:
Tipo: telefone IP de parede; protocolo SIP; alimentação PoE; código Intelbras 4061400.
Conteúdo da embalagem:
Telefone TDMI 400 IP e guia de instalação.
Indicação de uso:
Comunicação entre portaria e apartamentos, interfonia em empresas, hospitais, hotéis e escolas, e ramais VoIP em locais de parede.
Condição: produto novo.
Modernize a comunicação do seu condomínio ou empresa com a praticidade do VoIP Intelbras.', '{"Tipo":"Telefone IP de parede / interfone VoIP","Protocolo":"SIP","Alimentação":"PoE (ou fonte com injetor PoE passivo, vendidos separadamente)","Instalação":"Parede","Código do fabricante":"4061400","Homologação":"Anatel"}'::jsonb, array['tdmi 400 ip', 'telefone ip parede', 'interfone voip intelbras', 'telefone poe', 'intelbras tdmi 400', 'interfone ip condominio', 'telefone voip parede']::text[], 'Eletrônicos, Áudio e Vídeo > Telefonia > Telefonia VoIP > Telefones IP', 'Eletrônicos e celulares > Telefones e acessórios', '1 telefone TDMI 400 IP, guia de instalação', '1 ano de garantia do fabricante', null, 0.6, 8, 13, 25, 289, 275, 355, array['https://loja.intelbras.com.br/telefone-ip-tdmi-400-ip-intelbras/p', 'https://www.zoom.com.br/telefone-voip-voip-phone/telefone-ip-voip-poe-tdmi-400-ip-intelbras', 'https://backend.intelbras.com/sites/default/files/2024-07/Guia_TDMI_400IP_01-24_site.pdf']::text[], 'alta', '6 unidades: pode anunciar com estoque múltiplo. Ficha detalhada (codecs, nº de contas SIP) não confirmada; conferir no guia do produto.'),
  (10, 'Relógio de Ponto Biométrico Digital USB It-Blue SC-9002C', 'MÁQUINA DE PONTO IT BLUE SC 9002 C', 'It-Blue', 'SC-9002C', 'Controle de Acesso', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Relógio De Ponto Biométrico Digital Usb It-blue Sc-9002c', 'Relógio de Ponto Biométrico Digital USB It-Blue SC-9002C - Novo', 'Relógio de ponto biométrico digital It-Blue SC-9002C, prático e rápido para o controle de jornada de funcionários em pequenos negócios.
Principais recursos:
- Registro de ponto por impressão digital (biometria)
- Registro também por senha
- Tela LCD de 2,4 polegadas
- Comunicação/exportação de dados via USB
- Identificação rápida
- Instalação simples
Especificações técnicas:
Tipo: relógio de ponto biométrico; display LCD 2,4 pol; interface USB; métodos: digital e senha.
Conteúdo da embalagem:
Relógio de ponto SC-9002C e acessórios de fábrica.
Indicação de uso:
Controle interno de frequência em lojas, escritórios, oficinas, clínicas e pequenas empresas.
Observação: equipamento para controle interno, sem impressora de comprovante; verifique as exigências legais aplicáveis à sua empresa.
Condição: produto novo.
Organize o controle de horários da sua equipe com praticidade.', '{"Tipo":"Relógio de ponto biométrico","Display":"LCD 2,4 pol","Interface":"USB","Identificação":"Impressão digital e senha"}'::jsonb, array['relogio de ponto biometrico', 'it blue sc-9002c', 'maquina de ponto', 'ponto digital usb', 'relogio ponto digital', 'ponto eletronico biometrico']::text[], 'Indústria e Comércio > Equipamento para Escritórios > Relógios de Ponto', 'Comércio e escritório > Equipamentos e mobiliário', '1 relógio de ponto SC-9002C e acessórios de fábrica', 'Garantia do fabricante (conferir prazo)', null, 0.8, 8, 18, 22, 189, 170, 287, array['https://m.magazineluiza.com.br/busca/relogio+ponto', 'https://br.my-best.com/20066']::text[], 'media', 'Sem ficha oficial do fabricante. Conferir na caixa: se tem cartão RFID, capacidade de digitais/registros, alimentação e itens inclusos. Não anunciar como REP homologado (Portaria MTE).'),
  (11, 'Switch Não Gerenciável PoE 16 Portas Fast + 4 Uplink Gigabit Intelbras S1118F-PA', 'S1118F-PA SWITCH NAO GERENCIAVEL', 'Intelbras', 'S1118F-PA', 'Redes', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Switch Poe 16 Portas Intelbras S1118f-pa 125w Rack', 'Switch PoE 16 portas Intelbras S1118F-PA 125W 2 SFP - Novo', 'Switch não gerenciável Intelbras S1118F-PA com 16 portas Fast Ethernet PoE e 4 portas uplink Gigabit, perfeito para projetos de CFTV IP, telefonia IP e pontos de acesso Wi-Fi.
Principais recursos:
- 16 portas Fast Ethernet PoE (10/100 Mbps)
- 4 portas uplink Gigabit, sendo 2 combo SFP
- PoE padrão IEEE 802.3af/at com até 30 W por porta
- Orçamento PoE total de 125 W
- PoE Extender nas portas 1 a 8: alcance de até 250 m
- Função PD Alive: reinicia automaticamente a porta do dispositivo travado
- Formato 1U para rack 19 pol
- Plug and play, sem necessidade de configuração
Especificações técnicas:
Chipset Realtek RTL8326B; dimensões 440 x 44 x 220 mm; peso líquido 3,26 kg; padrões IEEE 802.3af/at.
Conteúdo da embalagem:
Switch S1118F-PA, cabo de alimentação, kit para fixação em rack e guia de instalação.
Indicação de uso:
Alimentação e conexão de câmeras IP, telefones IP e access points em condomínios, empresas e comércios.
Condição: produto novo.
Monte sua rede PoE com a confiabilidade Intelbras.', '{"Tipo":"Switch não gerenciável PoE","Portas PoE":"16 x Fast Ethernet 10/100","Uplink":"4 x Gigabit (2 combo SFP)","Padrão PoE":"IEEE 802.3af/at","Potência PoE total":"125 W","Potência por porta":"Até 30 W","PoE Extender":"Portas 1 a 8, até 250 m","PD Alive":"Sim","Chipset":"Realtek RTL8326B","Formato":"1U rack 19 pol","Dimensões":"440 x 44 x 220 mm","Peso líquido":"3,26 kg"}'::jsonb, array['switch poe 16 portas', 's1118f-pa', 'switch intelbras poe', 'switch poe rack', 'switch poe cftv', 'switch 16 portas poe 125w', 'switch nao gerenciavel']::text[], 'Informática > Conectividade e Redes > Switches', 'Eletrônicos e celulares > Computadores e acessórios', '1 switch S1118F-PA, cabo de alimentação, kit de fixação em rack, guia de instalação', '1 ano de garantia do fabricante', null, 4.2, 10, 30, 52, 1099, 1000, 1330, array['https://backend.intelbras.com/sites/default/files/2025-08/Datasheet%20-%20S1118F-PA.pdf', 'https://www.intelbras.com/pt-br/switch-nao-gerenciavel-fast-ethernet-poe-18-portas-s1118f-pa', 'https://www.magazineluiza.com.br/busca/switch+poe+++intelbras/']::text[], 'alta', 'Conferir itens da embalagem (kit rack, cabo de força).'),
  (12, 'Modem Óptico PON Intelbras ONT 140 PoE com 4 Portas Gigabit PoE', 'modem óptico PON LAN 4P PoE ONT 140 PoE', 'Intelbras', 'ONT 140 PoE', 'Redes', 'novo', 20, true, 'mercado_livre', 'a_revisar', null, 'Modem Óptico ONT GPON Intelbras ONT 140 PoE 4 Portas Giga', 'Modem Óptico ONT Intelbras ONT 140 PoE GPON/EPON 4 Portas PoE Novo', 'Modem óptico PON Intelbras ONT 140 PoE, novo, ideal para levar a fibra óptica até câmeras IP, controladores de acesso, access points e telefones IP sem precisar de switch PoE adicional. Com 4 portas Gigabit Ethernet, todas com PoE, o equipamento recebe o sinal da fibra e já alimenta os dispositivos pelo próprio cabo de rede.
Principais recursos:
- Compatível com GPON (ITU-T G.984) e EPON (IEEE 802.3ah)
- 4 portas Ethernet Gigabit 10/100/1000 Mbps RJ45
- PoE nas 4 portas, padrões IEEE 802.3af/at
- Até 30 W por porta e até 60 W no total
- Modos SFU (bridge) e HGU (roteador)
- Suporte a VLAN e QoS (IEEE 802.1p)
- Gerenciamento por OMCI, interface web e TR-069
- Proteção contra surtos de 25 kV (modo comum)
Especificações técnicas:
- Interface óptica: 1 porta SC/APC, fibra monomodo, até 20 km
- Comprimentos de onda: Tx 1310 nm / Rx 1490 nm
- Alimentação: 48 Vdc (fonte externa 100-240 Vac / 48 Vdc 1,35 A)
- Consumo máximo: 64,8 W
- Temperatura de operação: -10 °C a 55 °C
Conteúdo da embalagem: 1 modem óptico ONT 140 PoE (demais itens conforme embalagem do fabricante).
Indicação de uso: provedores de internet (ISP), integradores de CFTV, condomínios, empresas e redes corporativas que precisam alimentar e conectar câmeras e outros dispositivos PoE em pontos atendidos por fibra óptica.
Condição: produto novo, em embalagem original.
Garantia do fabricante Intelbras. Tire suas dúvidas pelo campo de perguntas antes de comprar.', '{"Marca":"Intelbras","Modelo":"ONT 140 PoE","Tecnologia PON":"GPON (ITU-T G.984) e EPON (IEEE 802.3ah)","Interface óptica":"1 porta SC/APC, fibra monomodo, até 20 km","Comprimento de onda":"Tx 1310 nm / Rx 1490 nm","Portas LAN":"4 x Gigabit Ethernet 10/100/1000 Mbps RJ45","PoE":"IEEE 802.3af/at nas 4 portas, até 30 W por porta e 60 W no total","Modos de operação":"SFU (bridge) e HGU (roteador)","Gerenciamento":"OMCI, interface web, TR-069","Alimentação":"48 Vdc via fonte externa (entrada 100-240 Vac, saída 48 Vdc 1350 mA)","Consumo máximo":"64,8 W","Proteção contra surtos":"25 kV modo comum / 1 kV modo diferencial","Temperatura de operação":"-10 °C a 55 °C","Umidade de operação":"10% a 90% sem condensação","Peso bruto":"470 g"}'::jsonb, array['ont 140 poe', 'onu gpon poe', 'modem optico intelbras', 'ont 4 portas poe', 'gpon epon intelbras', 'ont poe cftv', 'fibra optica poe', 'ont intelbras']::text[], 'Informática > Conectividade e Redes > Modems', 'Eletrônicos e celulares > Computadores e acessórios', '1 modem óptico ONT 140 PoE (confirmar se a fonte 48 V acompanha)', '1 ano de garantia do fabricante', null, 0.7, 6, 20, 25, 949, 899, 1100, array['https://www.kabum.com.br/produto/624623/modem-optico-pon-lan-4p-ont-140-poe-intelbras', 'https://www.intelbras.com/pt-br/modem-optico-pon-lan-4p-ont-140-poe', 'https://www.intelbras.com/en/optical-pon-modem-4-lan-ports-ont-140-poe']::text[], 'alta', 'Confirmar na caixa se a fonte 48 Vdc vem inclusa (a ficha cita fonte externa, a loja lista só o modem). Especificações vieram da ficha da Kabum; a ficha oficial da Intelbras estava marcada como temporária. Dimensões da embalagem são estimadas. Preço de referência baseado em uma única loja (Kabum ~R$ 1.028 a 1.050); conferir no ML.'),
  (13, 'Air Cooler para Processador be quiet! Dark Rock Elite ARGB 135 mm', 'Air Cooler EliteDark Hi-Level', 'be quiet!', 'Dark Rock Elite (BK037)', 'Informática', 'novo', 2, true, 'mercado_livre', 'a_revisar', null, 'Air Cooler Processador be quiet Dark Rock Elite ARGB 135mm', 'Air Cooler Processador be quiet Dark Rock Elite ARGB Intel AMD Novo', 'Air cooler para processador be quiet! Dark Rock Elite, novo, um dos coolers a ar mais potentes e silenciosos do mercado, indicado para processadores de alto desempenho Intel e AMD em PCs gamer e estações de trabalho.
Principais recursos:
- Capacidade de dissipação (TDP) de até 280 W
- 7 heat pipes de cobre de alto desempenho
- 2 ventoinhas Silent Wings de 135 mm com controle PWM
- Iluminação ARGB integrada
- Chave de velocidade com modo Quiet e modo Performance
- Sistema de trilho que permite ajustar a altura da ventoinha frontal, melhorando a compatibilidade com memórias RAM altas
- Tampa superior removível
Especificações técnicas:
- Compatibilidade Intel: LGA 1700, 1200, 1150, 1151, 1155
- Compatibilidade AMD: AM5 e AM4
- Ruído: 11,0 dB(A) a 50%, 19,5 dB(A) a 75% e 25,8 dB(A) a 100% de rotação
- Dimensões aproximadas do cooler: 145 x 136 x 168 mm
Conteúdo da embalagem: cooler com ventoinhas e kit de instalação conforme embalagem do fabricante.
Indicação de uso: upgrade de refrigeração para processadores de alto TDP, PCs gamer, edição de vídeo e renderização, para quem busca temperatura baixa com o mínimo de ruído.
Condição: produto novo, em embalagem original.
Confira a compatibilidade do soquete e a altura máxima de cooler suportada pelo seu gabinete antes da compra. Dúvidas, use o campo de perguntas.', '{"Marca":"be quiet!","Modelo":"Dark Rock Elite","Código do fabricante":"BK037","Tipo":"Air cooler para processador","TDP":"280 W","Heat pipes":"7","Ventoinhas":"2 x Silent Wings 135 mm PWM","Iluminação":"ARGB","Soquetes Intel":"LGA 1700 / 1200 / 1150 / 1151 / 1155","Soquetes AMD":"AM5 / AM4","Ruído":"11,0 / 19,5 / 25,8 dB(A) a 50% / 75% / 100%","Modos":"Quiet e Performance (chave de velocidade)","Dimensões do cooler":"145 x 136 x 168 mm"}'::jsonb, array['air cooler processador', 'be quiet dark rock elite', 'cooler processador argb', 'cooler am5', 'cooler lga 1700', 'dark rock elite bk037', 'cooler torre dupla ventoinha', 'cooler silencioso']::text[], 'Informática > Componentes para PC > Coolers e Ventiladores > Coolers para Processador', 'Eletrônicos e celulares > Computadores e acessórios', 'Cooler com 2 ventoinhas e kit de instalação (conforme fabricante)', 'Garantia do fabricante (confirmar prazo na embalagem)', null, 2, 22, 20, 20, 699, 650, 915, array['https://www.bequiet.com/en/cpucooler/dark-rock-elite/4468', 'https://www.terabyteshop.com.br/produto/29854/cooler-para-processador-be-quiet-dark-rock-elite-135mm-argb-pwm-intelamd-2-fans-bk037', 'https://www.hwcooling.net/en/bequiet-dark-rock-elite-the-new-king-of-coolers-review/9/']::text[], 'baixa', 'Não foi encontrado nenhum produto chamado ''EliteDark Hi-Level''. A interpretação mais provável é o be quiet! Dark Rock Elite (BK037), mas isso NÃO está confirmado. Conferir na caixa marca, modelo e código. Se for outra marca (cooler genérico/nacional), título, ficha técnica e preço precisam ser refeitos (preço de cooler genérico costuma ser bem menor). Peso e dimensões da embalagem são estimados.'),
  (14, 'Controlador de Acesso Facial Intelbras SS 3532 MF W Linha Bio-T', 'controlador de acesso facial SS 3532 MF W Linha BIO-T', 'Intelbras', 'SS 3532 MF W', 'Controle de Acesso', 'novo', 5, true, 'mercado_livre', 'a_revisar', null, 'Controlador Acesso Facial Intelbras SS 3532 MF W Wi-Fi PoE', 'Controlador de Acesso Facial Intelbras SS 3532 MF W Wi-Fi PoE Novo', 'Controlador de acesso com reconhecimento facial Intelbras SS 3532 MF W, linha Bio-T, novo. Libera o acesso por face, cartão RFID MF 13,56 MHz, QR Code ou senha, com conexão Ethernet, Wi-Fi e alimentação PoE, ideal para portas de empresas, condomínios, academias e escritórios, inclusive em áreas externas.
Principais recursos:
- Reconhecimento facial em cerca de 0,2 s
- Sistema anti-fake que impede acesso por foto ou vídeo
- Alerta e/ou bloqueio por uso de máscara
- Autenticação simples ou combinada (ex.: face + cartão)
- Tela LCD de 4,3 polegadas sensível ao toque
- Duas câmeras de 2 MP (RGB + IR) com IR inteligente
- Wi-Fi 2,4 GHz (802.11 b/g/n) e PoE IEEE 802.3af
- Opera em modo stand-alone, on-line/off-line ou com software (InControl Web, Defense IA ou terceiros)
- Suporte a OSDP, SDK e API/CGI
Especificações técnicas:
- Alimentação: 12 Vdc 2 A ou PoE 802.3af
- Capacidade: 6.000 usuários, 10.000 cartões/QR Codes, 300.000 registros, 50 administradores
- Interfaces: RS-485, Wiegand, USB 2.0, entrada e saída de alarme, botão de saída, sensor de porta, relé
- Grau de proteção: IP55 (IP65 com aplicação de fita isolante líquida, conforme fabricante)
- Temperatura de operação: -30 °C a 60 °C
- Dimensões: 90,1 x 180,1 x 27 mm
Conteúdo da embalagem: 1 controlador de acesso SS 3532 MF W e acessórios de instalação conforme fabricante. Fonte de alimentação não acompanha.
Indicação de uso: controle de acesso de portas com fechaduras elétricas, eletroímãs ou solenoides, em ambientes internos e externos.
Condição: produto novo, em embalagem original, com garantia do fabricante.
Dúvidas sobre integração e instalação, use o campo de perguntas.', '{"Marca":"Intelbras","Modelo":"SS 3532 MF W","Linha":"Bio-T","Modos de autenticação":"Facial, cartão RFID MF 13,56 MHz, QR Code e senha","Tela":"LCD 4,3\" touch capacitiva, 272 x 480 pixels","Câmeras":"2 x 2 MP CMOS 1/2,8\" (RGB + IR)","Tempo de reconhecimento facial":"0,2 s","Distância de reconhecimento":"0,3 a 1,5 m (ficha versão W)","Capacidade de usuários":"6.000 (ficha versão W)","Capacidade de cartões/QR Code":"10.000 (até 5 por usuário)","Capacidade de registros":"300.000","Administradores":"50","Comunicação":"Ethernet 10/100 + Wi-Fi 2,4 GHz 802.11 b/g/n","PoE":"IEEE 802.3af","Alimentação":"12 Vdc 2 A (fonte não inclusa) ou PoE","Consumo máximo":"12 W (versão W)","Interfaces":"RS-485, Wiegand, USB 2.0, entrada/saída de alarme, botão de saída, sensor de porta, relé","Protocolos":"IPv4, RTSP, RTP, TCP, UDP, SIP","Grau de proteção":"IP55 (IP65 com fita isolante líquida)","Temperatura de operação":"-30 °C a 60 °C","Material":"PC + ABS","Dimensões do produto":"90,1 x 180,1 x 27 mm","Peso bruto":"0,70 kg"}'::jsonb, array['controlador acesso facial', 'ss 3532 mf w', 'intelbras bio-t', 'reconhecimento facial intelbras', 'controle de acesso wifi poe', 'leitor facial porta', 'ss 3532', 'controle de acesso qr code']::text[], 'Segurança para Casa > Controle de Acesso > Controladores de Acesso', 'Eletrônicos e celulares > Outros itens', '1 controlador SS 3532 MF W e acessórios de instalação (fonte não inclusa)', '1 ano de garantia do fabricante', null, 0.7, 8, 14, 25, 1399, 1300, 2075, array['https://www.kabum.com.br/produto/644592/controlador-de-acesso-ss-3532-mf-w', 'https://www.intelbras.com/pt-br/controlador-de-acesso-facial-ss-3532-mf-w', 'https://backend.intelbras.com/sites/default/files/2025-11/Datasheet%20SS%203532%20MF_0.pdf', 'https://www.magazineluiza.com.br/busca/ss+mf+w']::text[], 'alta', 'Capacidade divergente: a ficha da versão W (Kabum) informa 6.000 usuários; a ficha mais recente da linha SS 3532 MF informa 10.000 usuários com firmware V3.002 ou superior. Anunciado com 6.000 por segurança. Conferir o EAN na caixa. Preços vistos: Magalu R$ 1.450 a 1.509 e Kabum R$ 2.075.'),
  (15, 'Controlador de Acesso Facial Intelbras SS 3532 MF W Linha Bio-T (Usado)', 'controlador de acesso facial SS 3532 MF W Linha BIO-T', 'Intelbras', 'SS 3532 MF W', 'Controle de Acesso', 'usado', 1, true, 'olx', 'a_revisar', null, 'Controlador Acesso Facial Intelbras SS 3532 MF W Wi-Fi PoE', 'Controlador de Acesso Facial Intelbras SS 3532 MF W Usado', 'Controlador de acesso com reconhecimento facial Intelbras SS 3532 MF W, linha Bio-T, usado. Libera o acesso por face, cartão RFID MF 13,56 MHz, QR Code ou senha, com conexão Ethernet, Wi-Fi e alimentação PoE. Ótima opção para quem quer um controle de acesso facial de qualidade pagando menos.
Principais recursos:
- Reconhecimento facial em cerca de 0,2 s
- Sistema anti-fake que impede acesso por foto ou vídeo
- Alerta e/ou bloqueio por uso de máscara
- Autenticação simples ou combinada (ex.: face + cartão)
- Tela LCD de 4,3 polegadas sensível ao toque
- Duas câmeras de 2 MP (RGB + IR) com IR inteligente
- Wi-Fi 2,4 GHz (802.11 b/g/n) e PoE IEEE 802.3af
- Opera em modo stand-alone, on-line/off-line ou com software (InControl Web, Defense IA ou terceiros)
Especificações técnicas:
- Alimentação: 12 Vdc 2 A ou PoE 802.3af
- Capacidade: 6.000 usuários, 10.000 cartões/QR Codes, 300.000 registros
- Interfaces: RS-485, Wiegand, USB 2.0, entrada e saída de alarme, botão de saída, sensor de porta, relé
- Grau de proteção: IP55 (IP65 com fita isolante líquida, conforme fabricante)
- Temperatura de operação: -30 °C a 60 °C
- Dimensões: 90,1 x 180,1 x 27 mm
Conteúdo: 1 controlador de acesso SS 3532 MF W. Fonte de alimentação não acompanha.
Indicação de uso: controle de acesso de portas com fechaduras elétricas, eletroímãs ou solenoides, em ambientes internos e externos.
Condição: produto usado, testado e funcionando.
Dúvidas, use o chat antes de fechar negócio.', '{"Marca":"Intelbras","Modelo":"SS 3532 MF W","Linha":"Bio-T","Condição":"Usado","Modos de autenticação":"Facial, cartão RFID MF 13,56 MHz, QR Code e senha","Tela":"LCD 4,3\" touch capacitiva, 272 x 480 pixels","Câmeras":"2 x 2 MP CMOS 1/2,8\" (RGB + IR)","Tempo de reconhecimento facial":"0,2 s","Capacidade de usuários":"6.000 (ficha versão W)","Capacidade de cartões/QR Code":"10.000 (até 5 por usuário)","Capacidade de registros":"300.000","Comunicação":"Ethernet 10/100 + Wi-Fi 2,4 GHz 802.11 b/g/n","PoE":"IEEE 802.3af","Alimentação":"12 Vdc 2 A (fonte não inclusa) ou PoE","Interfaces":"RS-485, Wiegand, USB 2.0, entrada/saída de alarme, botão de saída, sensor de porta, relé","Grau de proteção":"IP55 (IP65 com fita isolante líquida)","Temperatura de operação":"-30 °C a 60 °C","Dimensões do produto":"90,1 x 180,1 x 27 mm"}'::jsonb, array['controlador acesso facial usado', 'ss 3532 mf w', 'intelbras bio-t', 'reconhecimento facial intelbras', 'controle de acesso wifi poe', 'leitor facial porta', 'ss 3532 usado']::text[], 'Segurança para Casa > Controle de Acesso > Controladores de Acesso', 'Eletrônicos e celulares > Outros itens', '1 controlador SS 3532 MF W (fonte não inclusa)', 'Sem garantia', null, 0.7, 8, 14, 25, 990, 900, 1200, array['https://www.kabum.com.br/produto/644592/controlador-de-acesso-ss-3532-mf-w', 'https://www.intelbras.com/pt-br/controlador-de-acesso-facial-ss-3532-mf-w', 'https://backend.intelbras.com/sites/default/files/2025-11/Datasheet%20SS%203532%20MF_0.pdf']::text[], 'alta', 'Confirmar se tem caixa/acessórios, estado da tela e se foi restaurado de fábrica (apagar usuários e faces cadastrados antes de vender). Preço de usado estimado a partir do novo (R$ 1.450 a 2.075).'),
  (16, 'Controlador de Acesso Facial Intelbras SS 3531 MF Lite Linha Bio-T', 'CONTROLADOR DE ACESSO SS 3531 MF LITE', 'Intelbras', 'SS 3531 MF Lite', 'Controle de Acesso', 'novo', 3, true, 'mercado_livre', 'a_revisar', null, 'Controlador Acesso Facial Intelbras SS 3531 MF Lite QR Code', 'Controlador de Acesso Facial Intelbras SS 3531 MF Lite Novo', 'Controlador de acesso com reconhecimento facial Intelbras SS 3531 MF Lite, linha Bio-T, novo. Autentica por face, cartão RFID MF 13,56 MHz, QR Code ou senha, com excelente custo-benefício para controle de acesso em ambientes internos como escritórios, clínicas, academias e salas restritas.
Principais recursos:
- Reconhecimento facial em 0,2 s com precisão acima de 99,8%
- Detecção facial anti-fake que impede acesso por foto ou vídeo
- Alerta e/ou bloqueio por uso de máscara
- Tela LCD de 4,3 polegadas sensível ao toque (capacitiva)
- Duas câmeras de 2 MP (RGB + IR) com IR inteligente
- Autenticação simples ou combinada (ex.: cartão + face)
- QR Code com modo seguro criptografado em AES-128
- Opera em modo stand-alone, on-line/off-line ou com software (InControl Web, Defense IA ou terceiros)
- Sistema de coação, anti-passback e sensor de movimento
Especificações técnicas:
- Capacidade: 6.000 usuários, 6.000 faces, 10.000 cartões/QR Codes, 10.000 senhas, 300.000 registros
- Comunicação: 1 porta Ethernet 10/100
- Interfaces: RS-485, Wiegand, USB 2.0, entrada e saída de alarme, botão de saída, sensor de porta, relé
- Alimentação: 12 Vdc 2 A (fonte não acompanha)
- Consumo: até 9 W em operação, máximo 24 W
- Temperatura de operação: -10 °C a 55 °C
- Dimensões: 84,4 x 167,4 x 24 mm
Conteúdo da embalagem: 1 controlador SS 3531 MF Lite e acessórios de instalação conforme fabricante.
Indicação de uso: portas internas com fechadura elétrica, eletroímã ou solenoide.
Condição: produto novo, em embalagem original, com garantia do fabricante.
Dúvidas, use o campo de perguntas.', '{"Marca":"Intelbras","Modelo":"SS 3531 MF Lite","Linha":"Bio-T","Modos de autenticação":"Facial, cartão RFID MF 13,56 MHz, QR Code e senha","Tela":"LCD 4,3\" touch capacitiva, 272 x 480 pixels","Câmeras":"2 x 2 MP CMOS 1/2,8\" (RGB + IR)","Tempo de reconhecimento facial":"0,2 s","Precisão":"> 99,8%","Distância de reconhecimento":"0,3 a 2 m","Capacidade de usuários":"6.000","Capacidade de faces":"6.000","Capacidade de cartões/QR Code":"10.000 (até 5 por usuário)","Capacidade de senhas":"10.000","Capacidade de registros":"300.000","Administradores":"50","Comunicação":"1 porta Ethernet 10/100Base-T","Interfaces":"RS-485, Wiegand, USB 2.0, 1 entrada e 1 saída de alarme, botão de saída, sensor de porta, relé","Protocolos":"IPv4, RTP, TCP, UDP, SIP, 802.1x","Alimentação":"12 Vdc 2 A (fonte não inclusa)","Consumo":"≤ 9 W em operação / ≤ 24 W máximo","Ambiente de instalação":"Interno","Temperatura de operação":"-10 °C a 55 °C","Material":"PC + ABS","Dimensões do produto":"84,4 x 167,4 x 24 mm","Peso bruto":"0,56 kg"}'::jsonb, array['controlador acesso facial', 'ss 3531 mf lite', 'intelbras bio-t', 'reconhecimento facial intelbras', 'controle de acesso facial barato', 'leitor facial qr code', 'ss 3531']::text[], 'Segurança para Casa > Controle de Acesso > Controladores de Acesso', 'Eletrônicos e celulares > Outros itens', '1 controlador SS 3531 MF Lite e acessórios de instalação (fonte não inclusa)', '1 ano de garantia do fabricante', null, 0.56, 7, 13, 23, 999, 950, 1200, array['https://backend.intelbras.com/sites/default/files/2025-08/Datasheet%20SS%203531%20MF%20Lite.pdf', 'https://www.intelbras.com/pt-br/controlador-de-acesso-facial-ss-3531-mf-lite', 'https://www.magazineluiza.com.br/busca/ss+mf+w']::text[], 'alta', 'Uso indicado apenas para ambiente interno e sem Wi-Fi/PoE (só Ethernet) - não anunciar como externo. Conferir EAN na caixa. Preço de referência Magalu R$ 1.079 a 1.199.'),
  (17, 'Roteador Load Balance TP-Link TL-R470T+ Multi-WAN', 'TP-LINK TL-R470T+ Load Balance Broadband Router', 'TP-Link', 'TL-R470T+', 'Redes', 'usado', 1, true, 'olx', 'a_revisar', null, 'Roteador Load Balance TP-Link TL-R470T+ Multi WAN', 'Roteador Load Balance TP-Link TL-R470T+ Multi WAN Usado', 'Roteador com balanceamento de carga TP-Link TL-R470T+, usado. Permite juntar até 4 links de internet em um só equipamento, distribuindo o tráfego entre eles e mantendo a rede funcionando caso um link caia. Ideal para pequenas empresas, escritórios, lan houses e comércios que usam mais de uma operadora.
Principais recursos:
- Até 4 conexões WAN simultâneas
- 3 portas configuráveis como WAN ou LAN, total de 5 portas
- Balanceamento de carga por distribuição de banda ou por aplicação
- Failover automático quando o link principal falha
- Suporte a até 10 mil sessões simultâneas
- Recursos de controle de banda e firewall para redes corporativas
- Equipamento cabeado, sem Wi-Fi
Especificações técnicas:
- Portas: 5 portas 10/100 Mbps RJ45 (1 WAN, 1 LAN e 3 WAN/LAN configuráveis)
- Processador: 400 MHz
- Memória: 64 MB DRAM e 4 MB flash
- Sessões simultâneas: até 10.000
Conteúdo: 1 roteador TL-R470T+ (demais itens conforme anúncio/fotos).
Indicação de uso: agregação de links de internet, redundância de conexão e gerenciamento básico de rede em pequenas e médias empresas.
Condição: produto usado, testado e funcionando.
Dúvidas, chame no chat antes de fechar negócio.', '{"Marca":"TP-Link","Modelo":"TL-R470T+","Tipo":"Roteador cabeado com balanceamento de carga (Load Balance)","Condição":"Usado","Portas":"5 x 10/100 Mbps RJ45 (1 WAN, 1 LAN, 3 WAN/LAN configuráveis)","Máximo de WANs":"4","Balanceamento de carga":"Por banda, por aplicação e failover","Processador":"400 MHz","Memória":"64 MB DRAM / 4 MB flash","Sessões simultâneas":"até 10.000","Wi-Fi":"Não possui"}'::jsonb, array['tl-r470t+', 'roteador load balance', 'tp-link load balance', 'roteador multi wan', 'balanceamento de link', 'roteador 4 wan', 'failover internet']::text[], 'Informática > Conectividade e Redes > Roteadores', 'Eletrônicos e celulares > Computadores e acessórios', '1 roteador TL-R470T+ (confirmar fonte/cabo)', 'Sem garantia', null, 1, 8, 20, 30, 150, 120, 200, array['https://www.pichau.com.br/roteador-tp-link-load-balance-broadband-10-100mbps-tl-r470t', 'https://www.terabyteshop.com.br/produto/12077/manifest.json', 'https://cclonline.com/tl-r470t-tp-link-tl-r470t-load-balance-broadband-router', 'https://www.mysmartprice.com/computer/tp-tl-r470t+-load-balance-broadband-router-msf51993']::text[], 'alta', 'Conferir a versão de hardware na etiqueta (V5/V6 etc.): algumas versões têm fonte interna e outras usam fonte externa 9 V 0,6 A - informar no anúncio se acompanha fonte/cabo de força. Não foram encontrados anúncios de usado no Brasil; preço estimado a partir do novo (~R$ 260 na Pichau/Terabyte).'),
  (18, 'Câmera IP Bullet Intelbras VIP 1230 FC+ Full Color Plus 2 MP', 'VIP 1230 FC + CAMERA IP BULLET', 'Intelbras', 'VIP 1230 FC+', 'CFTV', 'novo', 10, true, 'mercado_livre', 'a_revisar', null, 'Câmera IP Bullet Intelbras VIP 1230 FC+ Full Color 2MP PoE', 'Câmera IP Bullet Intelbras VIP 1230 FC+ Full Color 2MP PoE Nova', 'Câmera IP bullet Intelbras VIP 1230 FC+ (Full Color Plus), nova. Com resolução Full HD 2 MP, ela combina infravermelho e iluminação Full Color, gerando imagens coloridas à noite quando necessário, além de microfone embutido e detecção inteligente de humanos.
Principais recursos:
- Resolução 2 MP Full HD (1920 x 1080) a até 30 fps
- Tecnologia Full Color + IR: infravermelho até 30 m e Full Color até 20 m
- Detecção de humanos e detecção de movimento inteligente
- Microfone embutido e detecção de áudio
- Compressão H.265, H.264 e compressão inteligente
- Alimentação 12 Vdc ou PoE (802.3af)
- Proteção IP67 contra poeira e água, para uso externo
- Proteção anti-surto de 15 kV
- Compatível com Intelbras Cloud, ONVIF e app Intelbras
Especificações técnicas:
- Sensor: 2 MP CMOS 1/2,8"
- Lente: fixa 3,6 mm, F1.6, ângulo horizontal de 88°
- DORI (3,6 mm): detectar 58,9 m, observar 23,6 m, reconhecer 11,8 m, identificar 5,9 m
- Rede: RJ-45 10/100
- Consumo máximo: 6,3 W (12 Vdc) / 7,8 W (PoE)
- Temperatura de operação: -40 °C a +60 °C
- Dimensões: 197,9 x 80,2 x 76,2 mm, peso líquido 310 g
Conteúdo da embalagem: 1 câmera VIP 1230 FC+ e manual do usuário.
Indicação de uso: monitoramento de residências, comércios, condomínios e empresas, em áreas internas e externas, com NVRs Intelbras ou softwares compatíveis.
Condição: produto novo, em embalagem original, com garantia do fabricante.', '{"Marca":"Intelbras","Modelo":"VIP 1230 FC+","Formato":"Bullet","Resolução":"2 MP (1920 x 1080)","Sensor":"2 MP CMOS 1/2,8\"","Lente":"Fixa 3,6 mm F1.6","Ângulo de visão":"H 88° / V 44° / D 105°","Alcance infravermelho":"30 m","Alcance Full Color":"20 m","Inteligência":"Detecção de humanos","Áudio":"Microfone embutido","Compressão":"H.265 / H.264 / H.264H / H.264B / MJPEG","Taxa de quadros":"até 30 fps","Rede":"RJ-45 10/100Base-T","Alimentação":"12 Vdc ou PoE (802.3af)","Consumo máximo":"6,3 W (12 Vdc) / 7,8 W (PoE)","Proteção anti-surto":"15 kV","Grau de proteção":"IP67","Temperatura de operação":"-40 °C a +60 °C","Material":"Plástico e metal","Dimensões":"197,9 x 80,2 x 76,2 mm","Peso líquido":"310 g"}'::jsonb, array['vip 1230 fc+', 'camera ip intelbras', 'camera bullet full color', 'camera ip poe 2mp', 'camera intelbras full color plus', 'camera com microfone', 'vip 1230 b fc+', 'cftv ip']::text[], 'Segurança para Casa > Câmeras de Segurança > Câmeras IP', 'Eletrônicos e celulares > Outros itens', '1 câmera VIP 1230 FC+ e manual do usuário', '1 ano de garantia do fabricante', null, 0.5, 10, 11, 23, 429, 400, 500, array['https://backend.intelbras.com/sites/default/files/2025-07/Datasheet%20VIP%201230%20BD%20FC+%20V3.pdf', 'https://www.intelbras.com/pt-br/camera-bullet-com-full-color-plus-vip-1230-fc', 'https://www.netalarmes.com.br/camera-intelbras-vip-1230-fc-bullet-full-color-ip67-2mp-30mts-3-6mm']::text[], 'alta', 'Confirmar na caixa se é o modelo bullet VIP 1230 FC+ (e não o VIP 1230 FC+ AP ou o dome VIP 1230 D FC+). Conferir EAN na caixa. Preço de referência ~R$ 456 a 480 (Net Alarmes).'),
  (19, 'Câmera IP Dome Intelbras VIP 3230 D SC IA Super Color 2 MP', 'VIP 3230 D SC IA CÂMERA IP DOME', 'Intelbras', 'VIP 3230 D SC IA', 'CFTV', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Câmera IP Dome Intelbras VIP 3230 D SC IA Super Color 2MP', 'Câmera IP Dome Intelbras VIP 3230 D SC IA Super Color 2MP Nova', 'Câmera IP dome Intelbras VIP 3230 D SC IA, nova, com tecnologia Super Color e inteligência artificial. Gera imagens coloridas mesmo em ambientes com pouquíssima luz, graças à lente F1.0 de alta abertura, e conta com detecção de humanos e veículos e microfone embutido.
Principais recursos:
- Resolução 2 MP Full HD (1920 x 1080) a até 30 fps
- Tecnologia Super Color com lente F1.0 e sensibilidade de 0,0006 lux
- Iluminação por LEDs brancos com alcance de até 30 m
- Inteligência artificial: detecção de humanos e veículos, linha virtual e cerca virtual com classificação
- Microfone embutido e detecção de áudio
- WDR real de 120 dB, BLC e HLC
- Slot para cartão microSD de até 256 GB (cartão não incluso)
- Compressão H.265, H.264 e modos inteligentes H.264+/H.265+
- Alimentação 12 Vdc ou PoE
- Proteção IP67 para uso interno e externo
Especificações técnicas:
- Sensor: 2 MP CMOS progressivo 1/2,9"
- Lente: fixa 2,8 mm F1.0, ângulo horizontal de 101,7°
- DORI: detectar 47,1 m, observar 18,9 m, reconhecer 9,4 m, identificar 4,7 m
- Rede: RJ-45 10/100, ONVIF, Intelbras Cloud
- Consumo: menor que 5,3 W
- Temperatura de operação: -40 °C a +60 °C
- Material: metal e plástico; peso líquido 0,40 kg
Conteúdo da embalagem: 1 câmera VIP 3230 D SC IA e acessórios de instalação conforme fabricante.
Indicação de uso: monitoramento de áreas internas e externas como recepções, garagens, corredores, lojas e condomínios, onde é importante ter imagem colorida à noite e alertas inteligentes.
Condição: produto novo, em embalagem original, com garantia do fabricante.', '{"Marca":"Intelbras","Modelo":"VIP 3230 D SC IA","Formato":"Dome","Resolução":"2 MP (1920 x 1080)","Sensor":"2 MP CMOS progressivo 1/2,9\"","Lente":"Fixa 2,8 mm F1.0","Ângulo de visão":"H 101,7° / V 53,7° / D 119°","Sensibilidade":"0,0006 lux @ F1.0","Iluminação":"2 LEDs brancos, alcance até 30 m","Inteligência artificial":"Detecção de humanos e veículos, linha virtual e cerca virtual com classificação, SMD","Áudio":"Microfone embutido","WDR":"120 dB","Compressão":"H.265 / H.264 / H.264B / H.264H / MJPEG / H.264+ / H.265+","Taxa de quadros":"1 a 30 fps","Armazenamento":"microSD até 256 GB (não incluso), FTP, SFTP, NAS","Rede":"RJ-45 10/100Base-T, ONVIF, Intelbras Cloud","Alimentação":"12 Vdc ou PoE","Consumo":"< 5,3 W","Grau de proteção":"IP67","Temperatura de operação":"-40 °C a +60 °C","Material":"Metal e plástico","Peso líquido":"0,40 kg"}'::jsonb, array['vip 3230 d sc ia', 'camera dome intelbras', 'camera super color', 'camera ip inteligencia artificial', 'camera dome poe 2mp', 'camera colorida noite', 'vip 3230 sc ia', 'cftv ip intelbras']::text[], 'Segurança para Casa > Câmeras de Segurança > Câmeras IP', 'Eletrônicos e celulares > Outros itens', '1 câmera VIP 3230 D SC IA e acessórios de instalação', '1 ano de garantia do fabricante', '7899298711438', 0.6, 12, 14, 14, 749, 700, 990, array['https://www.upperseg.com.br/cftv/cameras-de-seguranca/cameras-ip/camera-ip-com-fio/camera-ip-intelbras-vip-3230-d-sc-ia-dome-infravermelho-super-color-c-inteligencia-artificial-e-microfone-full-hd-1080p/', 'https://www.lojaonesecurity.com.br/camera-ip-dome-vip-3230-d-sc-ia-2mp-full-hd-super-color-lente-de-2-8mm-4570072', 'https://www.intelbras.com/en/dome-camera-with-super-color-technology-vip-3230-d-sc-ia']::text[], 'alta', 'EAN 7899298711438 veio de uma única loja (UpperSeg) - conferir com a etiqueta da caixa. Especificações vieram de revenda, a ficha oficial não pôde ser aberta. Preços vistos de R$ 712 (Pix UpperSeg) a R$ 985.'),
  (20, 'Telefone Sem Fio Digital Intelbras TS 3110 com Identificador de Chamadas', 'Telefone sem fio digital TS3110', 'Intelbras', 'TS 3110', 'Telefonia', 'novo', 18, true, 'mercado_livre', 'a_revisar', null, 'Telefone Sem Fio Digital Intelbras TS 3110 Identificador', 'Telefone Sem Fio Digital Intelbras TS 3110 com Identificador Novo', 'Telefone sem fio digital Intelbras TS 3110, novo. Prático e confiável, conta com tecnologia digital DECT 6.0, identificador de chamadas e display luminoso, ideal para casa, escritório e pequenos comércios.
Principais recursos:
- Tecnologia digital DECT 6.0, com menos interferência e mais privacidade
- Identificador de chamadas
- Display luminoso
- Agenda para 70 contatos
- Registro de 15 chamadas recebidas, 20 não atendidas e 15 originadas
- Expansível para até 7 ramais (base + 6 ramais, vendidos separadamente)
- Bateria recarregável
- Fonte bivolt
Especificações técnicas:
- Tecnologia: DECT 6.0
- Capacidade de ramais: até 6 fones adicionais
- Agenda: 70 contatos
- Alimentação da base: fonte bivolt 127/220 V
Conteúdo da embalagem: base, monofone, bateria, fonte de alimentação, cabo telefônico e manual (conforme embalagem do fabricante).
Indicação de uso: linha telefônica fixa residencial ou comercial, também compatível com PABX e adaptadores de telefonia.
Condição: produto novo, em embalagem original, com 1 ano de garantia do fabricante.
Temos várias unidades disponíveis. Dúvidas, use o campo de perguntas.', '{"Marca":"Intelbras","Modelo":"TS 3110","Tipo":"Telefone sem fio digital","Tecnologia":"DECT 6.0","Identificador de chamadas":"Sim","Display":"Luminoso","Agenda":"70 contatos","Registro de chamadas":"15 recebidas, 20 não atendidas, 15 originadas","Capacidade de ramais":"Até 7 (base + 6 ramais)","Alimentação":"Bivolt 127/220 V","Garantia":"1 ano"}'::jsonb, array['telefone sem fio intelbras', 'ts 3110', 'telefone sem fio digital', 'telefone dect 6.0', 'telefone com identificador', 'telefone fixo sem fio', 'intelbras ts3110']::text[], 'Celulares e Telefones > Telefonia Fixa e Sem Fio > Telefones Sem Fio', 'Eletrônicos e celulares > Telefones e acessórios', 'Base, monofone, bateria, fonte, cabo telefônico e manual (conferir)', '1 ano de garantia do fabricante', null, 0.45, 8, 14, 20, 169, 150, 203, array['https://loja.intelbras.com.br/telefone-sem-fio-ts-3110-preto/p', 'https://www.casasbahia.com.br/telefone-sem-fio-intelbras-com-identificador-de-chamada-preto-ts3110/p/1581923724', 'https://www.buscape.com.br/telefone/telefone-sem-fio-intelbras-ts-3110', 'https://www.telhanorte.com.br/telefone-residencial-sem-fio-preto-intelbras-1424696/p']::text[], 'alta', 'Viva-voz: lojas divergem (Telhanorte diz que tem, Casas Bahia diz que não) - não foi colocado no anúncio, conferir no aparelho/caixa. Conferir cor (preto/branco), conteúdo da caixa e EAN. Preço: loja oficial R$ 202,90, ML ~R$ 189,90, Casas Bahia R$ 179,90.'),
  (21, 'Controlador de Acesso Facial Intelbras SS 5531 MF EX Tela 7 Polegadas Uso Externo', 'SS 5531 MF EX CONTROLADOR ACESSO FACIAL', 'Intelbras', 'SS 5531 MF EX', 'Controle de Acesso', 'novo', 3, true, 'mercado_livre', 'a_revisar', 'ATENÇÃO: ''vendido como 3531, atenção ao anunciar'' — confirmar com o dono qual modelo anunciar', 'Controlador Facial Intelbras SS 5531 MF EX Tela 7 Externo', 'Controlador de Acesso Facial Intelbras SS 5531 MF EX Tela 7 Novo', 'Controlador de acesso com reconhecimento facial Intelbras SS 5531 MF EX, novo. Modelo com tela de 7 polegadas e grande capacidade de cadastro, preparado para ambientes internos e externos, ideal para portarias de condomínios, empresas, indústrias e academias com muitos usuários.
Principais recursos:
- Reconhecimento facial em 0,2 s com precisão acima de 99,5%
- Detecção facial anti-fake que impede acesso por foto ou vídeo
- Alerta e/ou bloqueio por uso de máscara
- Tela LCD de 7 polegadas sensível ao toque (600 x 1024)
- Duas câmeras de 2 MP (RGB + IR) com IR inteligente
- Autenticação por face, cartão RFID MF 13,56 MHz, QR Code e senha, simples ou combinada
- Capacidade para 50.000 usuários e 50.000 faces
- Opera em modo stand-alone, on-line/off-line ou com software (InControl Web, Defense IA ou terceiros)
- Atualização de firmware via InControl Web e Defense IA
Especificações técnicas:
- Capacidade: 50.000 usuários, 50.000 faces, 100.000 cartões/QR Codes, 50.000 senhas, 300.000 registros
- Comunicação: 1 porta Ethernet 10/100
- Interfaces: RS-485, Wiegand, USB 2.0, 2 entradas e 1 saída de alarme, botão de saída, sensor de porta, relé
- Alimentação: 12 Vdc 2 A (fonte não acompanha)
- Consumo: 8,4 W em operação, máximo 24 W
- Grau de proteção: IP55, uso interno e externo
- Temperatura de operação: -30 °C a 60 °C
- Dimensões: 225,5 x 115,9 x 28,2 mm
Conteúdo da embalagem: 1 controlador SS 5531 MF EX e acessórios de instalação conforme fabricante.
Indicação de uso: portas e portões com fechadura elétrica, eletroímã ou solenoide em áreas expostas a poeira e chuva.
Condição: produto novo, em embalagem original, com garantia do fabricante.', '{"Marca":"Intelbras","Modelo":"SS 5531 MF EX","Modos de autenticação":"Facial, cartão RFID MF 13,56 MHz, QR Code e senha","Tela":"LCD 7\" touch capacitiva, 600 x 1024 pixels","Câmeras":"2 x 2 MP CMOS 1/2,8\" (RGB + IR)","Tempo de reconhecimento facial":"0,2 s","Precisão":"> 99,5%","Distância de reconhecimento":"0,3 a 1,5 m","Capacidade de usuários":"50.000","Capacidade de faces":"50.000","Capacidade de cartões/QR Code":"100.000 (até 5 por usuário)","Capacidade de senhas":"50.000","Capacidade de registros":"300.000","Administradores":"50","Comunicação":"1 porta Ethernet 10/100Base-T","Interfaces":"RS-485, Wiegand, USB 2.0, 2 entradas e 1 saída de alarme, botão de saída, sensor de porta, relé","Protocolos":"IPv4, RTP, TCP, UDP, SIP, 802.1x","Alimentação":"12 Vdc 2 A (fonte não inclusa)","Consumo":"8,4 W em operação / ≤ 24 W máximo","Grau de proteção":"IP55","Ambiente de instalação":"Interno e externo","Temperatura de operação":"-30 °C a 60 °C","Material":"PC + ABS","Dimensões do produto":"225,5 x 115,9 x 28,2 mm","Peso bruto":"0,90 kg"}'::jsonb, array['ss 5531 mf ex', 'controlador acesso facial externo', 'intelbras facial 7 polegadas', 'reconhecimento facial intelbras', 'controle de acesso condominio', 'leitor facial externo', 'ss 5531']::text[], 'Segurança para Casa > Controle de Acesso > Controladores de Acesso', 'Eletrônicos e celulares > Outros itens', '1 controlador SS 5531 MF EX e acessórios de instalação (fonte não inclusa)', '1 ano de garantia do fabricante', null, 0.9, 8, 17, 30, 1499, 1400, 1900, array['https://backend.intelbras.com/sites/default/files/2025-04/Datasheet%20SS%205531%20MF%20EX%202_1.pdf', 'https://www.kabum.com.br/produto/893821/controlador-acesso-fac-ss-5531-mf-ex', 'https://www.segurancaetelecom.com.br/p/controlador-de-acesso-facial-ss-5531-mf-ex', 'https://www.upperseg.com.br/interfonia/controle-de-acesso/acesso-facial/controlador-de-acesso-facial-ss-5531-mf-ex-intelbras/', 'https://backend.intelbras.com/sites/default/files/2025-08/Datasheet%20SS%203531%20MF%20Lite.pdf']::text[], 'media', 'ATENÇÃO (obs do dono: ''vendido como 3531''): anúncio montado como SS 5531 MF EX. O dono PRECISA conferir a etiqueta/caixa antes de publicar. Diferenças: SS 5531 MF EX = tela 7" (600x1024), 50.000 usuários/faces, 100.000 cartões, IP55 uso interno e externo, 2 entradas de alarme, 225,5 x 115,9 x 28,2 mm, 0,90 kg, preço novo ~R$ 1.400 a 1.900. SS 3531 MF (Lite, única versão 3531 encontrada no site da Intelbras) = tela 4,3" (272x480), 6.000 usuários/faces, 10.000 cartões, só uso interno, 1 entrada de alarme, 84,4 x 167,4 x 24 mm, 0,56 kg, preço novo ~R$ 1.080 a 1.200. Se o produto físico for o 3531, usar os dados do item 16. Não anunciar como um modelo sendo o outro (gera reclamação/devolução).'),
  (22, 'Fonte de Alimentação Ininterrupta Carregadora Intelbras FA 1220S 2 A com Temporizador', 'fonte de alimentação ininterrupta 2 A FA 1220S G', 'Intelbras', 'FA 1220S G2', 'Energia', 'novo', 2, true, 'mercado_livre', 'a_revisar', null, 'Fonte Carregadora Intelbras FA 1220S 2A com Temporizador', 'Fonte Ininterrupta Carregadora Intelbras FA 1220S 2A Temporizador Nova', 'Fonte de alimentação ininterrupta carregadora Intelbras FA 1220S, nova. Mantém fechaduras, controles de acesso, câmeras e equipamentos de rede funcionando mesmo durante quedas de energia, usando uma bateria 12 V instalada dentro do próprio gabinete (bateria vendida separadamente).
Principais recursos:
- Fonte chaveada full range, sem chave seletora de tensão (100 a 240 Vac)
- Corrente máxima de saída de 2 A
- Carregador microcontrolado com carga inteligente da bateria, aumentando sua vida útil
- Temporizador integrado para fechaduras eletromagnéticas, ajustável em 1, 5, 15, 30 ou 60 segundos
- Modo Segurança ou Econômico para gerenciamento da bateria
- Entrada para botão de saída (contato seco) ou acionamento por interfone (pulso 12 a 24 V)
- Saída auxiliar de até 1,1 A para controle de acesso, CFTV, redes ou automação
- LEDs indicativos de carga, bateria, saída e rede
- Proteção contra curto-circuito, sobrecarga e inversão de polaridade da bateria
Especificações técnicas:
- Entrada: 100 a 240 Vac (90 a 264 Vac), 50/60 Hz
- Saída: 14,4 Vdc nominal, até 2 A (28,8 W)
- Bateria compatível: 12 V 7 Ah (não inclusa)
- Temperatura de operação: 0 °C a 40 °C
- Gabinete plástico branco: 210 x 270 x 95 mm
- Peso: 790 g
Conteúdo da embalagem: 1 fonte FA 1220S em gabinete plástico (bateria não inclusa).
Indicação de uso: sistemas de controle de acesso com fechadura eletroímã, CFTV, redes e automação que precisam continuar operando sem energia da rede elétrica.
Condição: produto novo, em embalagem original, com garantia do fabricante.', '{"Marca":"Intelbras","Modelo":"FA 1220S (versão G2 a confirmar)","Tipo":"Fonte de alimentação ininterrupta carregadora","Tensão de entrada":"100 a 240 Vac (90 a 264 Vac), 50/60 Hz","Tensão de saída":"14,4 Vdc nominal","Corrente máxima":"2 A","Potência":"28,8 W (carga nominal)","Saída auxiliar":"até 1,1 A","Temporizador de fechadura":"1, 5, 15, 30 ou 60 s","Bateria compatível":"12 V 7 Ah (não inclusa)","Proteções":"Fusível na entrada, curto-circuito, sobrecarga, inversão de polaridade da bateria","Sinalização":"LEDs de carga, bateria, saída e rede","Temperatura de operação":"0 °C a 40 °C","Dimensões":"210 x 270 x 95 mm","Peso":"790 g"}'::jsonb, array['fonte fa 1220s', 'fonte ininterrupta intelbras', 'fonte carregadora 12v', 'fonte nobreak fechadura', 'fonte controle de acesso', 'fonte com temporizador', 'fa 1220s g2', 'fonte eletroima']::text[], 'Segurança para Casa > Controle de Acesso > Fontes de Alimentação', 'Eletrônicos e celulares > Outros itens', '1 fonte FA 1220S em gabinete plástico (sem bateria)', '1 ano de garantia do fabricante', null, 0.95, 11, 23, 29, 189, 180, 280, array['https://www.dicomp.com.br/downloads/materiais_apoio/datasheet/20630-2.pdf', 'https://www.intelbras.com/pt-br/fonte-de-alimentacao-carregadora-fa-1220s-g2-sem-bateria', 'https://www.magazineluiza.com.br/busca/fonte+fa+1220s/']::text[], 'media', 'O nome ''FA 1220S G'' provavelmente é a FA 1220S G2 (sem bateria). Ficha técnica baseada no guia da FA 1220S original; a G2 aceita bateria de 7 ou 9 Ah e pode ter pequenas diferenças. Conferir na etiqueta: versão (G2?), se vem com bateria (se vier, o preço sobe) e EAN. Atenção: a saída nominal é 14,4 Vdc / 2 A (não 12 V exatos). Preço de referência Magalu G2 ~R$ 204; outras versões R$ 271 a 388.'),
  (23, 'Patch Panel Furukawa 24 Portas Cat6 para Rack 19 pol', 'Patch panel Furukawa', 'Furukawa', 'Patch Panel 24 portas (linha a confirmar: GigaLan / Sohoplus / MultiLan)', 'Redes', 'usado', 2, true, 'olx', 'a_revisar', 'Quantidade de portas/categoria não informada — conferir', 'Patch Panel Furukawa 24 Portas Cat6 Rack 19 Usado', 'Patch Panel Furukawa 24 Portas Cat6 Rack 19 - Usado', 'Patch panel Furukawa para organização e terminação de cabeamento estruturado em racks padrão 19 polegadas. Furukawa é uma das marcas de referência em cabeamento estruturado no Brasil, muito utilizada em projetos corporativos, CPDs e provedores.
Principais recursos:
- Organiza e identifica os pontos de rede em um único painel
- Montagem em rack padrão 19 polegadas
- Conectores RJ45 frontais para patch cords
- Terminação traseira em conectores IDC (padrão T568A/B)
- Facilita manutenção, testes e remanejamento de pontos
Especificações técnicas:
- Marca: Furukawa
- Tipo: patch panel para cabeamento estruturado UTP
- Montagem: rack 19 polegadas
- Quantidade de portas e categoria: conferir na etiqueta do produto (anúncio considera 24 portas Cat6)
Conteúdo:
- 1 patch panel Furukawa (sem cabos e sem parafusos de rack, salvo indicação)
Aplicação:
Indicado para racks de rede em empresas, escritórios, escolas, condomínios, provedores de internet e instalações de CFTV IP que precisam de cabeamento organizado e profissional.
Condição do produto:
Produto usado, testado e funcionando. Possui marcas normais de uso. Disponível em 2 unidades.
Garanta uma rede organizada com material de qualidade Furukawa por um preço muito abaixo do novo.', '{"Marca":"Furukawa","Tipo":"Patch panel UTP","Montagem":"Rack 19 polegadas","Padrão de crimpagem":"T568A/B","Quantidade de portas":"A confirmar (provável 24)","Categoria":"A confirmar (provável Cat6)"}'::jsonb, array['patch panel furukawa', 'patch panel 24 portas', 'patch panel cat6', 'patch panel rack 19', 'furukawa gigalan', 'furukawa sohoplus', 'cabeamento estruturado', 'patch panel usado']::text[], 'Informática > Conectividade e Redes > Patch Panels', 'Eletrônicos e celulares > Computadores e acessórios', '1 patch panel Furukawa', 'Sem garantia', null, 1.2, 8, 50, 15, 220, 150, 400, array['https://store.intcomex.com/en-XPE/Product/Detail/228644', 'https://www.pontofrio.com.br/patch-panel-furukawa-sohoplus-cat6-24-portas-t568a-b-35050439/p/1560575046', 'https://www.magazineluiza.com.br/busca/patch+furukawa+cat6']::text[], 'baixa', 'Conferir quantidade de portas (24/48), categoria (Cat5e/Cat6/Cat6A), linha (GigaLan, Sohoplus, MultiLan) e se e 1U ou 2U. Ajustar título e preço (novo custa ~R$ 665 a R$ 1.500 para 24p Cat6).'),
  (24, 'Switch Intelbras SF 2400 QR+ 24 Portas Fast Ethernet Rack 19 pol', 'intelbras SF 2400 QR+ Switch 24 Portas Fast Ethernet', 'Intelbras', 'SF 2400 QR+', 'Redes', 'usado', 1, true, 'olx', 'a_revisar', null, 'Switch Intelbras SF 2400 QR+ 24 Portas Fast Ethernet', 'Switch Intelbras SF 2400 QR+ 24 Portas 10/100 Rack 19 - Usado', 'Switch Intelbras SF 2400 QR+ com 24 portas Fast Ethernet 10/100 Mbps, ideal para ampliar a rede de escritórios, lojas, condomínios e pequenas empresas. Modelo não gerenciável, plug and play, com gabinete metálico para instalação em rack padrão 19 polegadas.
Principais recursos:
- 24 portas RJ45 10/100 Mbps com negociação automática de velocidade
- Plug and play: basta conectar, sem necessidade de configuração
- Gabinete para rack 19 polegadas
- Capacidade de comutação de 4,8 Gbps
- Ideal para CFTV IP, telefonia IP e rede de computadores
Especificações técnicas:
- Marca: Intelbras
- Modelo: SF 2400 QR+
- Portas: 24 x RJ45 10/100 Mbps
- Capacidade de comutação: 4,8 Gbps
- Taxa de encaminhamento: 3,5 Mpps
- Tabela de endereços MAC: 8K
- Instalação: rack 19 polegadas
Conteúdo:
- 1 switch SF 2400 QR+
Aplicação:
Indicado para quem precisa interligar muitos pontos de rede com baixo custo: computadores, impressoras, câmeras IP, NVRs, telefones IP e pontos de acesso.
Condição do produto:
Produto usado, testado e funcionando. Possui marcas normais de uso.
Um switch robusto da Intelbras com 24 portas por um preço bem abaixo do novo.', '{"Marca":"Intelbras","Modelo":"SF 2400 QR+","Portas":"24 x RJ45 10/100 Mbps","Gerenciável":"Não","Capacidade de comutação":"4,8 Gbps","Taxa de encaminhamento":"3,5 Mpps","Tabela MAC":"8K","Instalação":"Rack 19 polegadas","Status no fabricante":"Descontinuado"}'::jsonb, array['switch intelbras 24 portas', 'sf 2400 qr+', 'sf2400qr', 'switch 24 portas fast ethernet', 'switch rack 19', 'switch 10/100', 'switch intelbras usado']::text[], 'Informática > Conectividade e Redes > Switches', 'Eletrônicos e celulares > Computadores e acessórios', '1 switch (cabo de energia e kit rack a conferir)', 'Sem garantia', null, 2.5, 10, 50, 25, 200, 150, 260, array['https://www.intelbras.com/pt-br/switch-24-portas-fast-ethernet-sf-2400-qr', 'https://www.pichau.com.br/switch-intelbras-fast-ethernet-sf-2400-qr-24-portas-preto-sf-2400-qr', 'https://lista.mercadolivre.com.br/switch-intelbras-sf-2400-qr', 'https://www.impactaseg.com.br/switch-24-portas-fast-ethernet-intelbras-sf-2400-qr/']::text[], 'alta', 'Conferir se acompanha cabo de força e orelhas de rack.'),
  (25, 'Microinversor Fotovoltaico Intelbras EGT 600 MICRO 600 W 220 V', 'intelbras micro inversor fotovoltaico EGT 600 MICRO', 'Intelbras', 'EGT 600 MICRO', 'Energia Solar', 'usado', 1, true, 'olx', 'a_revisar', 'Usado, qualidade excelente', 'Microinversor Solar Intelbras EGT 600 Micro 600W 220V', 'Microinversor Solar Intelbras EGT 600 Micro 600W 220V - Usado', 'Microinversor fotovoltaico on grid Intelbras EGT 600 MICRO, com 600 W de potência de saída em 220 V e dois rastreadores MPPT independentes, permitindo ligar até 2 módulos solares. Solução compacta, com Wi-Fi integrado e certificação Inmetro.
Principais recursos:
- 600 W de potência máxima de saída
- 2 MPPTs independentes (2 módulos por microinversor)
- Wi-Fi integrado para monitoramento
- Grau de proteção IP67, para instalação externa sob os módulos
- Eficiência máxima de 96,5%
- Conectores CC compatíveis com MC4
Especificações técnicas:
- Tensão máxima de entrada CC: 60 V
- Faixa de operação: 20 a 60 V
- Faixa de MPPT: 25 a 55 V
- Corrente máxima de entrada: 2 x 10,4 A
- Corrente de curto-circuito: 13 A
- Potência máxima de saída: 600 W
- Tensão nominal de saída: 220/240 Vca
- Corrente máxima de saída: 2,72 A
- Temperatura de operação: -40 a +65 C
Conteúdo:
- 1 microinversor EGT 600 MICRO
Aplicação:
Indicado para sistemas fotovoltaicos residenciais e comerciais conectados a rede, ampliação de sistemas existentes e instalações com sombreamento parcial, onde o MPPT por módulo aumenta a geração.
Condição do produto:
Produto usado, testado e funcionando, em excelente estado de conservação.
Gere sua própria energia com um microinversor de marca reconhecida por um preço muito abaixo do novo.', '{"Marca":"Intelbras","Modelo":"EGT 600 MICRO","Tipo":"Microinversor on grid","Potência máxima de saída":"600 W","Tensão nominal de saída":"220/240 Vca","Corrente máxima de saída":"2,72 A","Número de MPPTs":"2","Tensão máxima de entrada":"60 Vcc","Faixa de operação":"20 a 60 Vcc","Faixa de MPPT":"25 a 55 Vcc","Corrente máxima de entrada":"2 x 10,4 A","Corrente de curto-circuito":"13 A","Eficiência máxima":"96,5%","Grau de proteção":"IP67","Temperatura de operação":"-40 a +65 C","Comunicação":"Wi-Fi integrado","Status no fabricante":"Descontinuado"}'::jsonb, array['microinversor intelbras', 'egt 600 micro', 'microinversor 600w', 'microinversor 220v', 'inversor solar on grid', 'energia solar', 'microinversor usado']::text[], 'Casa, Móveis e Decoração > Energia Solar > Inversores', 'Para a sua casa > Materiais de construção e jardim', '1 microinversor (cabos/conectores a conferir)', 'Sem garantia', null, 3, 10, 30, 35, 1400, 1200, 1800, array['https://www.intelbras.com/pt-br/microinversor-fotovoltaico-600-w-220-v-egt-600-micro', 'https://backend.intelbras.com/sites/default/files/2022-05/Datasheet_EGT_600_MICRO.pdf', 'https://backend.intelbras.com/sites/default/files/2021-05/Manual_EGT_600_1200_MICRO_02-21_site_0.pdf', 'https://lista.mercadolivre.com.br/microinversor-intelbras', 'https://www.olx.com.br/anuncios/microinversor']::text[], 'alta', 'Conferir se acompanha cabo AC/conectores. Novo custa ~R$ 2.550 a R$ 3.350 no ML.'),
  (26, 'OLT GPON Intelbras 8820 I 8 Portas PON com 2 Uplinks SFP+ 10G', 'CONCENTRADOR DE INTERFACE DE DADOS OLT 8820i', 'Intelbras', 'OLT 8820 I', 'Redes', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'OLT Gpon Intelbras 8820 I 8 Portas Pon 1024 Clientes', 'OLT GPON Intelbras 8820 I 8 Portas PON SFP+ 10G Nova', 'OLT GPON Intelbras 8820 I, concentrador de interfaces de dados para provedores de internet via fibra óptica. Com 8 portas PON, atende até 1024 clientes (ONTs/ONUs) em formato compacto de 1U, com uplinks 10G e alimentação redundante.
Principais recursos:
- 8 portas GPON, cada uma atendendo até 128 ONTs
- Até 1024 ONTs no total
- 2 interfaces SFP+ 10G para uplink
- Transporte de dados e voz (serviços triple-play: dados, voz e vídeo)
- Alimentação 48 Vdc redundante
- Gerência via CLI (Telnet/SSH) e OMCI, com 2 portas de gerência out-of-band
- Sem bloqueio para ONTs e ONUs de terceiros
Especificações técnicas:
- Marca: Intelbras
- Modelo: OLT 8820 I
- Portas PON: 8 GPON (2,5 Gbps downstream)
- Alcance: até 20 km
- Uplink: 2 x SFP+ 10G
- Formato: stand alone 1U para rack 19 polegadas
- Alimentação: 48 Vdc redundante
Conteúdo:
- 1 OLT 8820 I e acessórios originais de fábrica
Aplicação:
Indicada para provedores regionais (ISPs) que estão implantando ou expandindo redes FTTH, condomínios e empresas que precisam de distribuição de internet por fibra óptica.
Condição do produto:
Produto novo.
Invista em uma OLT nacional, com suporte Intelbras, para crescer sua rede de fibra com segurança.', '{"Marca":"Intelbras","Modelo":"OLT 8820 I","Tipo":"OLT GPON","Portas PON":"8 GPON","ONTs por porta":"Até 128","Total de ONTs":"Até 1024","Taxa PON":"2,5 Gbps","Alcance":"Até 20 km","Uplink":"2 x SFP+ 10G","Gerência":"2 portas out-of-band; CLI Telnet/SSH; OMCI","Formato":"Stand alone 1U","Alimentação":"48 Vdc redundante","Garantia":"2 anos"}'::jsonb, array['olt intelbras', 'olt 8820 i', 'olt 8820i', 'olt gpon 8 portas', 'olt provedor', 'ftth', 'olt 1024 clientes', 'gpon intelbras']::text[], 'Informática > Conectividade e Redes > Fibra Óptica > OLTs', 'Eletrônicos e celulares > Computadores e acessórios', '1 OLT 8820 I, acessórios de fixação e documentação (conferir)', '2 anos de garantia do fabricante', null, 6, 12, 55, 40, 16900, 15000, 22000, array['https://www.intelbras.com/pt-br/olt-8-portas-gpon-olt-8820-i', 'https://backend.intelbras.com/sites/default/files/2024-09/Datasheet%20OLT%208820%20I%2001.2021%20V2.pdf', 'https://produto.mercadolivre.com.br/MLB-3358218469-olt-intelbras-8820i-8-portas-gpon-e-8-portas-gigabit-_JM', 'https://www.lojapivnet.com.br/PROVEDORFIBRA/OLTINTELBRASGPONOLT8820I8PORTASGPONATE1024CLIENTES']::text[], 'alta', 'Confirmar se vem com fontes/módulos de alimentação e se inclui módulos SFP. Anúncios do ML citam também 8 portas Gigabit; conferir no equipamento antes de incluir.'),
  (27, 'Repetidora para Central de Alarme de Incêndio Endereçável Intelbras RP 520', 'RP 520 REPETIDORA CENT ENDER', 'Intelbras', 'RP 520', 'Alarme e Sensores', 'novo', 4, true, 'mercado_livre', 'a_revisar', null, 'Repetidora Central Incêndio Endereçável Intelbras RP 520', 'Repetidora para Central de Incêndio Endereçável Intelbras RP 520', 'Repetidora Intelbras RP 520 para centrais de alarme de incêndio endereçáveis da linha CIE. Sua função é descentralizar as informações dos eventos registrados pela central, permitindo acompanhar e operar o sistema a partir de outros pontos da edificação, como portarias secundárias, salas de segurança e brigada.
Principais recursos:
- Repete todos os eventos da central CIE em seu display LCD
- Notifica alarmes, falhas e qualquer anormalidade detectada pela central
- Permite comandar o sistema de detecção e alarme de incêndio a distância
- Alimentada pela própria central, sem necessidade de fonte adicional
- Até 4 repetidoras por central
- Comunicação RS485
- Programação por software gratuito
Especificações técnicas:
- Marca: Intelbras
- Modelo: RP 520
- Compatibilidade: centrais endereçáveis CIE 1125, CIE 1250 e CIE 2500
- Não compatível com CIE 1060
- Interface: display LCD
- Comunicação: RS485
- Quantidade máxima por central: 4
Conteúdo:
- 1 repetidora RP 520 e manual
Aplicação:
Indicada para edifícios comerciais e residenciais, condomínios, indústrias, galpões, hospitais, escolas e shoppings, onde há mais de uma portaria ou área de controle.
Condição do produto:
Produto novo. Disponível em 4 unidades.
Amplie o controle do seu sistema de incêndio com um acessório original Intelbras.', '{"Marca":"Intelbras","Modelo":"RP 520","Tipo":"Repetidora para central de alarme de incêndio endereçável","Compatibilidade":"CIE 1125, CIE 1250, CIE 2500","Incompatibilidade":"CIE 1060","Display":"LCD","Comunicação":"RS485","Máximo por central":"4 repetidoras","Alimentação":"Fornecida pela central"}'::jsonb, array['rp 520 intelbras', 'repetidora central incêndio', 'repetidora cie', 'rp520', 'central endereçável intelbras', 'cie 1125', 'cie 2500', 'alarme de incêndio']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Alarmes e Sensores > Centrais de Alarme', 'Eletrônicos e celulares > Outros itens', '1 repetidora RP 520, manual', '1 ano de garantia do fabricante', null, 0.8, 8, 25, 20, 790, 709, 1104, array['https://www.intelbras.com/pt-br/repetidora-para-central-de-alarme-de-incendio-rp-520', 'https://www.intelbras.com/en/repeater-for-fire-alarm-control-center-rp-520', 'https://backend.intelbras.com/sites/default/files/2022-02/Datasheet_%20RP%20520_ES.pdf', 'https://www.techtrio.com.br/produtos/repetidora-para-central-enderecavel-rp-520-intelbras/', 'https://www.upperseg.com.br/deteccao-e-alarme-de-incendio/acessorios/repetidora-para-central-de-alarme-de-incendio-rp-520-intelbras/', 'https://www.magazineluiza.com.br/repetidora-para-central-enderecavel-cie-rp520-intelbras/p/cj44e3fe44/fs/salr/']::text[], 'alta', 'Confirmar prazo de garantia na caixa/manual.'),
  (28, 'String Box Solar 1040 Vcc 4 Entradas 2 Saídas (Protetor Elétrico)', 'STRINGBOX 1040V 4 Entr. 2 Saida PROTETOR ELETRICO', 'Clamper', 'CLAMPER Solar SB 1040V 20A 4E/2S', 'Energia Solar', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'String Box Solar 1040V 4 Entradas 2 Saídas Clamper 20A', 'String Box Solar 1040V 4 Entradas 2 Saídas Clamper 20A Nova', 'String box solar 1040 Vcc com 4 entradas e 2 saídas, quadro de proteção e manobra para o lado de corrente contínua de sistemas fotovoltaicos on grid. Reúne em um único painel as proteções contra surtos e o seccionamento das strings, garantindo segurança na instalação e na manutenção.
Principais recursos:
- 4 entradas de strings e 2 saídas CC
- Tensão máxima de 1040 Vcc
- Corrente de 20 A por entrada
- Duas saídas com circuitos independentes em um único painel
- Caixa com grau de proteção IP65, adequada para uso externo
- Proteção contra surtos de tensão no lado CC
Especificações técnicas:
- Tensão máxima: 1040 Vcc
- Entradas: 4
- Saídas: 2
- Corrente por entrada: 20 A
- Grau de proteção: IP65
Conteúdo:
- 1 string box montada
Aplicação:
Indicada para usinas e sistemas fotovoltaicos residenciais, comerciais e rurais com inversores de 2 MPPTs, protegendo o inversor e os módulos contra surtos e permitindo o seccionamento seguro das strings.
Condição do produto:
Produto novo.
Proteja seu investimento em energia solar com uma string box completa e pronta para instalar.', '{"Tipo":"String box / quadro de proteção CC","Tensão máxima":"1040 Vcc","Entradas":"4","Saídas":"2","Corrente por entrada":"20 A","Grau de proteção":"IP65"}'::jsonb, array['string box 1040v', 'string box 4 entradas 2 saídas', 'string box 4e 2s', 'stringbox solar', 'clamper solar sb', 'proteção fotovoltaica', 'dps solar', 'quadro proteção cc']::text[], 'Casa, Móveis e Decoração > Energia Solar > String Box', 'Para a sua casa > Materiais de construção e jardim', '1 string box', '1 ano de garantia do fabricante', null, 2.5, 15, 30, 35, 520, 450, 700, array['https://demape.com.br/wp-content/uploads/2022/03/Datasheet_CLAMPER-Solar-SB-1040V-20A-4E_2S-PC.pdf', 'https://www.lojaclamper.com.br/dps-clamper-solar-string-box-1040v-4e-2s-20ka/p', 'https://executiveloja.com.br/produto/25019/protetor-eletrico-stringbox-1000v-4e-2s-intelbras', 'https://www.dts.tec.br/protetor-eletrico-stringbox-1000v-4e-2s-18272-7']::text[], 'baixa', 'Marca/modelo não informados. O nome ''Protetor Elétrico Stringbox'' e usado por distribuidores Intelbras, mas a Intelbras lista modelo 1000V 4E-2S; já 1040V 4E/2S é típico da Clamper (e também Proauto/Embrastec). Conferir etiqueta (marca, código, corrente) e ajustar título, ficha e preço.'),
  (29, 'String Box Intelbras ESB 1106 600 Vcc 1 Entrada 1 Saída', 'STRING BOX ESB 1106', 'Intelbras', 'ESB 1106', 'Energia Solar', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'String Box Intelbras ESB 1106 600V 1 Entrada 1 Saída', 'String Box Intelbras ESB 1106 600V 1 Entrada 1 Saída Nova', 'String Box Intelbras ESB 1106, quadro elétrico para proteção e manobra de gerador fotovoltaico. Com 1 entrada e 1 saída e tensão de 600 Vcc, protege o sistema solar contra surtos de tensão e permite isolar o arranjo fotovoltaico com segurança para manutenção, evitando acidentes como curtos-circuitos.
Principais recursos:
- 1 entrada e 1 saída de string
- Tensão de 600 Vcc
- Chave seccionadora certificada e confiável
- DPS classe II para proteção contra surtos
- Componentes de alta qualidade montados em trilho DIN 35 mm
- Pronta para instalar
Especificações técnicas:
- Marca: Intelbras
- Modelo: ESB 1106
- Código Intelbras: 4840005
- Tensão máxima: 600 Vcc
- Entradas: 1
- Saídas: 1
- Proteção contra surtos: DPS classe II
- Seccionamento: chave seccionadora CC
Conteúdo:
- 1 string box ESB 1106
- Manual
Aplicação:
Indicada para sistemas fotovoltaicos on grid residenciais e de pequeno porte com uma string, entre os módulos e o inversor.
Condição do produto:
Produto novo.
Segurança e qualidade Intelbras para o seu sistema de energia solar.', '{"Marca":"Intelbras","Modelo":"ESB 1106","Código do fabricante":"4840005","Tipo":"String box / quadro de proteção e manobra CC","Tensão máxima":"600 Vcc","Entradas":"1","Saídas":"1","Proteção contra surtos":"DPS classe II","Seccionamento":"Chave seccionadora CC","Montagem interna":"Trilho DIN 35 mm"}'::jsonb, array['string box intelbras', 'esb 1106', 'string box 600v', 'string box 1 entrada 1 saída', 'protetor elétrico stringbox', 'string box solar', 'dps solar']::text[], 'Casa, Móveis e Decoração > Energia Solar > String Box', 'Para a sua casa > Materiais de construção e jardim', '1 string box ESB 1106, manual', '1 ano de garantia do fabricante', null, 1.5, 12, 25, 30, 849, 750, 965, array['https://www.intelbras.com/pt-br/quadro-eletrico-para-protecao-e-manobra-de-gerador-fotovoltaico-string-box-esb-1106', 'https://backend.intelbras.com/sites/default/files/2019-12/Manual_do_usuario_Stringbox_02-19.pdf', 'https://www.orusseg.com.br/protetor-eletrico-intelbras-stringbox-600v-1-entrada-1-saida-esb-1106', 'https://rkfnobreaks.com/string-box-esb-1106']::text[], 'alta', 'Fontes divergem no grau de proteção (página cita IP65, manual cita IP20); conferir na etiqueta antes de anunciar. Poucas ofertas online para referência de preço.'),
  (30, 'OLT GPON TP-Link DeltaStream DS-P7001-01 Pizza-box 1 Porta PON', 'DeltaStream 1-port Pizzabox GPON Optical Line Terminal DS-P7001', 'TP-Link', 'DS-P7001-01', 'Redes', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'OLT Gpon TP-Link DeltaStream DS-P7001-01 1 Porta Pon', 'OLT GPON TP-Link DeltaStream DS-P7001-01 1 Porta PON 10G Nova', 'OLT GPON TP-Link DeltaStream DS-P7001-01, terminal de linha óptica compacto em formato pizza-box com 1 porta GPON. Atende até 128 ONTs com divisão 1:128, ideal para pequenos provedores, condomínios, empresas e projetos FTTH de pequeno porte.
Principais recursos:
- 1 porta GPON com divisão de até 1:128 (até 128 ONTs)
- 2,5G downstream / 1,25G upstream
- Uplink 10G SFP+ e uplink 2.5G Ethernet RJ45
- Alimentação por fonte DC ou PoE 802.3at
- Ativação zero-touch de ONUs e provisionamento automático por perfis
- Gerência via DPMS (DeltaStream PON Management System), SNMP, CLI e Web
Especificações técnicas:
- Marca: TP-Link (linha DeltaStream)
- Modelo: DS-P7001-01
- Portas: 1 GPON, 1 SFP+ 10G, 1 RJ45 2.5G (com PoE), porta console e porta de gerência
- Alimentação: adaptador DC 12 V / 2,5 A ou PoE 802.3at (42,5 a 57 V)
- Consumo máximo: 17 W
- Dimensões: 294 x 140 x 44 mm (1U)
Conteúdo:
- 1 OLT DS-P7001-01 e acessórios originais de fábrica
Aplicação:
Indicada para provedores iniciando operação em fibra, redes de condomínios, hotéis, campus e empresas que precisam distribuir internet por GPON com baixo custo de entrada.
Condição do produto:
Produto novo.
Comece sua rede GPON com uma OLT compacta, econômica e de fácil gerenciamento.', '{"Marca":"TP-Link","Linha":"DeltaStream","Modelo":"DS-P7001-01","Tipo":"OLT GPON pizza-box","Portas PON":"1 GPON","Divisão máxima":"1:128","Taxa PON":"2,5G down / 1,25G up","Uplink":"1 x SFP+ 10G, 1 x RJ45 2.5G (PoE)","Gerência":"Porta console e RJ45 de gerência; DPMS, SNMP, CLI, Web","Alimentação":"DC 12 V / 2,5 A ou PoE 802.3at","Consumo máximo":"17 W","Dimensões":"294 x 140 x 44 mm"}'::jsonb, array['olt tp-link', 'ds-p7001-01', 'olt deltastream', 'olt 1 porta gpon', 'olt gpon pequena', 'olt pizza box', 'ftth', 'olt provedor']::text[], 'Informática > Conectividade e Redes > Fibra Óptica > OLTs', 'Eletrônicos e celulares > Computadores e acessórios', '1 OLT DS-P7001-01, acessórios e documentação (conferir fonte e módulo SFP)', 'Garantia do fabricante (conferir prazo TP-Link)', null, 2, 10, 40, 25, 1990, 1800, 2700, array['https://service-provider.tp-link.com/br/pon-ont/ds-p7001-01/', 'https://www.tp-link.com/ca/products/details/ds-p7001-01.html', 'https://www.casaevideo.com.br/olt-gpon-pizza-box-de-1-porta-deltastream-ds-p7001-01-3046718/p', 'https://www.shopar.com.br/produto/conectividade/olt/gpon/olt_gpon_tplink_pizzabox_de_1_porta_deltastream_dsp700101/19899/', 'https://www.tekdistribuidor.com.br/olt-1-pon-ds-p7001-01-gpon-com-1-porta-gpon-tp-link']::text[], 'alta', 'Conferir se acompanha fonte DC e módulo SFP GPON (algumas ofertas vendem com módulo C+ incluso). Confirmar prazo de garantia na caixa.'),
  (31, 'DVR Intelbras MHDX 1016-C 16 Canais Multi HD Série 1000', 'DVR MHDX 1016-C', 'Intelbras', 'MHDX 1016-C', 'CFTV', 'usado', 2, true, 'olx', 'a_revisar', null, 'DVR Intelbras MHDX 1016-C 16 Canais Multi HD H.265+', 'DVR Intelbras MHDX 1016-C 16 Canais Multi HD H.265+ - Usado', 'DVR Intelbras MHDX 1016-C da Série 1000, gravador de vídeo Multi HD com 16 canais, compatível com as principais tecnologias de câmeras do mercado. Solução completa para sistemas de CFTV residenciais e comerciais, com compressão H.265+ para economizar espaço em disco.
Principais recursos:
- 16 canais BNC + 2 canais IP
- Modo NVR para até 18 câmeras IP
- Compatível com 5 tecnologias: HDCVI, AHD, HDTVI, analógica e IP
- Compressão H.265 e H.265+
- Detecção inteligente de movimento
- Criptografia de áudio e vídeo
- Compatibilidade ONVIF
- Suporte a 1 HD SATA
Especificações técnicas:
- Marca: Intelbras
- Modelo: MHDX 1016-C
- Canais: 16 BNC + 2 IP (ou 18 IP no modo NVR)
- Tecnologias: HDCVI, AHD, HDTVI, analógica, IP
- Compressão: H.265 / H.265+
- Armazenamento: 1 baia SATA
Conteúdo:
- 1 DVR MHDX 1016-C (fonte e acessórios conforme disponibilidade)
Aplicação:
Indicado para residências, comércios, condomínios, empresas e galpões que precisam monitorar até 16 câmeras analógicas/HD ou câmeras IP.
Condição do produto:
Produto usado, testado e funcionando. Disponível em 2 unidades. HD não incluso, salvo indicação no anúncio.
Aproveite um DVR Intelbras completo e versátil por um preço bem abaixo do novo.', '{"Marca":"Intelbras","Modelo":"MHDX 1016-C","Série":"1000","Canais":"16 BNC + 2 IP","Modo NVR":"Até 18 canais IP","Tecnologias suportadas":"HDCVI, AHD, HDTVI, Analógica, IP","Compressão":"H.265 / H.265+","Armazenamento":"1 HD SATA (não incluso)","ONVIF":"Sim"}'::jsonb, array['dvr intelbras 16 canais', 'mhdx 1016-c', 'mhdx 1016', 'dvr multi hd', 'dvr 16 canais', 'dvr h.265', 'dvr intelbras usado', 'cftv']::text[], 'Segurança > Câmeras e Acessórios > DVRs', 'Eletrônicos e celulares > Câmeras e filmadoras', '1 DVR (fonte, mouse e HD a conferir)', 'Sem garantia', null, 2, 10, 35, 30, 650, 450, 900, array['https://www.intelbras.com/en/1000-series-video-recorder-with-16-channels-mhdx-1016-c', 'https://www.extra.com.br/dvr-16-canais-intelbras-mhdx-1016-c-multi-hd-ip-hdcvi-hdtvi-ahd-e-analogica-onvif/p/1563500434', 'https://www.kabum.com.br/produto/527460/kit-intelbras-dvr-mhdx-1016-c-16-canais-multi-hd-hd-1tb', 'https://www.olx.com.br/anuncios/dvr-mhdx']::text[], 'alta', 'Conferir se acompanha HD, fonte e mouse (com HD o preço sobe). Ajustar preço por unidade.'),
  (32, 'CPE Rádio Outdoor Intelbras WOM 5A 5 GHz 16 dBi', 'WOM 5A ROTEADOR WIRELESS', 'Intelbras', 'WOM 5A', 'Redes', 'usado', 1, true, 'olx', 'a_revisar', null, 'Rádio Cpe Intelbras WOM 5A 5ghz 16dbi Outdoor', 'Rádio CPE Intelbras WOM 5A 5GHz 16dBi Outdoor - Usado', 'Rádio CPE outdoor Intelbras WOM 5A, roteador wireless de 5 GHz com antena painel integrada de 16 dBi. Sua principal aplicação é como cliente em redes ponto-multiponto de provedores de internet, realizando enlaces sem fio de até 4 km.
Principais recursos:
- Antena painel direcional integrada de 16 dBi com dupla polarização
- Enlaces de até 4 km
- Padrão IEEE 802.11a/n em 5 GHz
- Taxa nominal de 150 Mbps (throughput TCP de até 80 Mbps)
- Modos Access Point, Cliente (WDS), Cliente (ARP NAT) e Cliente iPoll
- Alimentação PoE passivo e proteção antissurto de 15 kV
Especificações técnicas:
- Marca: Intelbras
- Modelo: WOM 5A (SiSo 1x1)
- Frequência: 5 GHz
- Largura de canal: 5, 10, 20 e 40 MHz
- Potência máxima: 28 dBm
- Abertura: azimute 40 graus, elevação 18 graus
- Processador: Qualcomm Atheros 600 MHz
- Interface: 1 porta Fast Ethernet 10/100 RJ45
- Segurança: WEP, WPA/WPA2 e WPA/WPA2 Enterprise
- Alimentação: PoE passivo 12 a 24 Vdc
- Consumo máximo: 2,8 W
Conteúdo:
- 1 rádio WOM 5A (fonte PoE a conferir)
Aplicação:
Indicado para provedores de internet via rádio, levar internet de um ponto a outro (casa, sítio, galpão), interligar câmeras de CFTV entre prédios e enlaces de curta e média distância.
Condição do produto:
Produto usado, testado e funcionando.
Solução prática e econômica para levar internet sem fio a distância.', '{"Marca":"Intelbras","Modelo":"WOM 5A","Tipo":"CPE outdoor 5 GHz","Antena":"Painel integrado 16 dBi, dupla polarização","Alcance":"Até 4 km","Padrão":"IEEE 802.11a/n","Taxa nominal":"150 Mbps","Throughput TCP":"80 Mbps","Potência máxima":"28 dBm","Largura de canal":"5/10/20/40 MHz","Interface":"1 x Fast Ethernet RJ45","Alimentação":"PoE passivo 12 a 24 Vdc","Consumo máximo":"2,8 W","Proteção antissurto":"15 kV"}'::jsonb, array['wom 5a', 'intelbras wom 5a', 'rádio 5ghz intelbras', 'cpe 5ghz', 'antena wireless outdoor', 'rádio enlace', 'roteador wireless externo', 'wom 5a usado']::text[], 'Informática > Conectividade e Redes > Antenas e Rádios Wireless', 'Eletrônicos e celulares > Computadores e acessórios', '1 rádio WOM 5A (fonte/injetor PoE a conferir)', 'Sem garantia', null, 0.6, 8, 15, 28, 160, 120, 220, array['https://www.intelbras.com/es/cpe-5-ghz-con-una-antena-de-16-dbi-siso-1x1-wom-5a', 'https://www.dicomp.com.br/downloads/materiais_apoio/datasheet/14546-1.pdf', 'https://www.olx.com.br/anuncios/intelbras-wom']::text[], 'media', 'Conferir na etiqueta se é WOM 5A (SiSo) ou WOM 5A MiMo (a MiMo tem 300 Mbps e 6 km e vale um pouco mais). Conferir se acompanha fonte PoE.'),
  (33, 'Balun Passivo com Alimentação Intelbras XBP 502A 1 Canal (Par)', 'Power Balun passivo XBP 502A', 'Intelbras', 'XBP 502A', 'CFTV', 'novo', 15, true, 'mercado_livre', 'a_revisar', null, 'Power Balun Passivo Intelbras XBP 502A Par Vídeo e Energia', 'Power Balun Passivo Intelbras XBP 502A Par Vídeo e Energia Novo', 'Power balun passivo Intelbras XBP 502A, balun de 1 canal que transmite vídeo e alimentação da câmera pelo mesmo cabo de rede UTP. Elimina a necessidade de cabo coaxial e de fonte no ponto da câmera, simplificando e barateando a instalação de CFTV.
Principais recursos:
- Transmissão de vídeo e alimentação em um único cabo UTP
- Alimentação de 12 ou 24 Vdc, corrente máxima de 1 A
- Compatível com câmeras analógicas, HDCVI, HDTVI e AHD
- Proteção PTC contra sobrecarga ou curto-circuito nas saídas de alimentação
- Proteção de 2 kV na entrada/saída de vídeo
- Passivo: não precisa de energia própria para o vídeo
Especificações técnicas:
- Marca: Intelbras
- Modelo: XBP 502A
- Canais: 1
- Alimentação transmitida: 12 ou 24 Vdc, até 1 A
- Distâncias para vídeo e alimentação: analógico até 300 m; HDCVI 720p até 250 m; HDTVI 720p até 200 m; AHD 720p até 150 m
- Fonte de alimentação: externa, adquirida separadamente
Conteúdo:
- 1 par de baluns XBP 502A
Aplicação:
Indicado para instaladores e projetos de CFTV em residências, comércios, condomínios e empresas que usam cabeamento UTP para levar vídeo e energia até as câmeras.
Condição do produto:
Produto novo. Várias unidades disponíveis.
Instalação mais limpa, rápida e econômica com balun original Intelbras.', '{"Marca":"Intelbras","Modelo":"XBP 502A","Tipo":"Balun passivo com alimentação (power balun)","Canais":"1","Alimentação transmitida":"12 ou 24 Vdc, até 1 A","Distância analógico":"300 m","Distância HDCVI 720p":"250 m","Distância HDTVI 720p":"200 m","Distância AHD 720p":"150 m","Proteção de alimentação":"PTC contra sobrecarga e curto-circuito","Proteção de vídeo":"2 kV","Status no fabricante":"Descontinuado"}'::jsonb, array['balun intelbras', 'xbp 502a', 'power balun', 'balun com alimentação', 'balun passivo', 'balun utp cftv', 'balun hdcvi', 'vídeo balun']::text[], 'Segurança > Câmeras e Acessórios > Baluns', 'Eletrônicos e celulares > Câmeras e filmadoras', '1 par de baluns XBP 502A', '1 ano de garantia do fabricante', null, 0.15, 4, 10, 14, 85, 70, 150, array['https://www.intelbras.com/pt-br/balun-com-alimentacao-de-1-canal-xbp-502a', 'https://www.dicomp.com.br/downloads/materiais_apoio/datasheet/10647-1.pdf', 'https://lista.mercadolivre.com.br/balun-xbp-502a', 'https://againstalacoes.com.br/acessorios-cftv/conectores/balun-conversor-par-xbp-502a-01canal-400m-c-alimentacao-intelbras', 'https://www.eletronicacastro.com.br/produto/power-balloon-balun-passivo-xbp-502a-intelbras/']::text[], 'alta', 'Confirmar se as 15 unidades são 15 pares (embalagens) ou 15 baluns avulsos; preço sugerido é por par. Produto descontinuado pela Intelbras.'),
  (34, 'Suporte para Vidro Intelbras SV 21150 D para Fechadura Eletroímã FE 21150 D', 'suporte para vidro SV 21150 D', 'Intelbras', 'SV 21150 D', 'Fechaduras e Acessórios', 'novo', 1, true, 'mercado_livre', 'a_revisar', 'Unidade nova, completa, para venda', 'Suporte Porta de Vidro Intelbras SV 21150 D Eletroímã', 'Suporte Porta de Vidro Intelbras SV 21150 D p/ Fechadura Eletroímã', 'Suporte Intelbras SV 21150 D, acessório original desenvolvido para permitir a instalação da fechadura eletroímã FE 21150 D em portas de vidro. Ideal para quem precisa automatizar o acesso de portas de vidro temperado em escritórios, lojas, clínicas e condomínios com segurança e acabamento profissional.
Principais recursos:
- Desenvolvido especificamente para a fechadura eletroímã Intelbras FE 21150 D (150 kgf)
- Indicado para portas de vidro de até 10 mm de espessura
- Fabricado em aço com pintura eletrostática preta, garantindo maior resistência mecânica
- Acabamento eletrostático que oferece maior resistência à corrosão
- Aplicável em portas de vidro com batente de vidro ou de alvenaria
- Instalação simples e firme, sem necessidade de furar o vidro para fixação da fechadura
Especificações técnicas:
- Material: aço com pintura eletrostática preta
- Espessura máxima do vidro: 10 mm
- Dimensões: 165 x 58 x 18 mm
- Peso: 0,660 kg
- Temperatura de operação: 0 °C a 60 °C
- Compatibilidade: fechadura eletroímã Intelbras FE 21150 D
Conteúdo da embalagem:
- 1 suporte SV 21150 D com seus componentes de fixação
Aplicação: instalação de fechadura eletroímã FE 21150 D em portas de vidro de controle de acesso, integrável a controladores de acesso, porteiros eletrônicos e botoeiras de saída.
Condição: produto novo, completo, na embalagem.
Observação: a fechadura eletroímã não acompanha o suporte, sendo vendida separadamente.
Garanta uma instalação segura e com acabamento original Intelbras na sua porta de vidro.', '{"Marca":"Intelbras","Modelo":"SV 21150 D","Tipo":"Suporte para fechadura eletroímã em porta de vidro","Compatibilidade":"Fechadura eletroímã Intelbras FE 21150 D","Material":"Aço com pintura eletrostática preta","Espessura máxima do vidro":"10 mm","Dimensões":"165 x 58 x 18 mm","Peso":"0,660 kg","Temperatura de operação":"0 °C a 60 °C","Cor":"Preto"}'::jsonb, array['suporte vidro fechadura eletroima', 'SV 21150 D', 'suporte FE 21150 D', 'intelbras suporte porta vidro', 'suporte eletroima vidro', 'fechadura magnetica porta de vidro', 'controle de acesso porta vidro']::text[], 'Ferramentas e Construção > Segurança para Casa > Fechaduras e Trancas > Acessórios para Fechaduras', 'Para a sua casa > Materiais de construção e jardim', '1 suporte SV 21150 D com componentes de fixação', '1 ano de garantia do fabricante', null, 0.8, 6, 8, 20, 115, 90, 160, array['https://www.intelbras.com/pt-br/suporte-para-fechadura-eletroima-fe-21150-d-sv-21150-d', 'https://www.dicomp.com.br/downloads/materiais_apoio/datasheet/20799-1.pdf', 'https://backend.intelbras.com/sites/default/files/2026-06/Guia_FE_21150D_03-26_site%20%281%29.pdf']::text[], 'alta', 'Preço estimado (Mercado Livre bloqueou consulta direta); conferir valores atuais de anúncios do SV 21150 D antes de publicar. Confirmar itens de fixação na embalagem.'),
  (35, 'Suporte para Vidro Intelbras SV 21150 D (incompleto)', 'suporte para vidro SV 21150 D (incompleto)', 'Intelbras', 'SV 21150 D', 'Fechaduras e Acessórios', 'usado', 1, false, 'nenhum', 'somente_estoque', 'Incompleta, não vende', 'Suporte Porta de Vidro Intelbras SV 21150 D Eletroímã', 'Suporte Porta de Vidro Intelbras SV 21150 D Usado Incompleto', 'Suporte Intelbras SV 21150 D, acessório desenvolvido para a instalação da fechadura eletroímã FE 21150 D em portas de vidro. Unidade usada e incompleta, mantida em estoque apenas para controle e eventual aproveitamento de peças.
Principais recursos:
- Desenvolvido para a fechadura eletroímã Intelbras FE 21150 D (150 kgf)
- Indicado para portas de vidro de até 10 mm de espessura
- Fabricado em aço com pintura eletrostática preta
- Maior resistência mecânica e à corrosão
- Aplicável em portas de vidro com batente de vidro ou alvenaria
Especificações técnicas:
- Material: aço com pintura eletrostática preta
- Espessura máxima do vidro: 10 mm
- Dimensões: 165 x 58 x 18 mm
- Peso: 0,660 kg
- Temperatura de operação: 0 °C a 60 °C
Conteúdo: suporte incompleto (faltam componentes; conferir quais).
Aplicação: reposição de peças ou complemento de outro suporte SV 21150 D.
Condição: produto usado e incompleto. Item não destinado à venda neste momento.', '{"Marca":"Intelbras","Modelo":"SV 21150 D","Tipo":"Suporte para fechadura eletroímã em porta de vidro","Compatibilidade":"Fechadura eletroímã Intelbras FE 21150 D","Material":"Aço com pintura eletrostática preta","Espessura máxima do vidro":"10 mm","Dimensões":"165 x 58 x 18 mm","Peso":"0,660 kg"}'::jsonb, array['SV 21150 D', 'suporte vidro fechadura eletroima', 'suporte FE 21150 D', 'intelbras suporte porta vidro', 'peça suporte eletroima']::text[], 'Ferramentas e Construção > Segurança para Casa > Fechaduras e Trancas > Acessórios para Fechaduras', 'Para a sua casa > Materiais de construção e jardim', 'Suporte incompleto, sem embalagem completa', 'Sem garantia', null, 0.7, 6, 8, 20, null, null, null, array['https://www.intelbras.com/pt-br/suporte-para-fechadura-eletroima-fe-21150-d-sv-21150-d', 'https://www.dicomp.com.br/downloads/materiais_apoio/datasheet/20799-1.pdf']::text[], 'alta', 'Não é para venda (incompleto). Listar quais peças faltam caso queira juntar com outra unidade.'),
  (36, 'Suporte para Vidro Intelbras SV 20150 para Fechadura Eletroímã FE 20150 (incompleto)', 'suporte para vidro SV 20150 (incompleto)', 'Intelbras', 'SV 20150', 'Fechaduras e Acessórios', 'usado', 2, false, 'nenhum', 'somente_estoque', 'Incompletas, não pra venda', 'Suporte Porta de Vidro Intelbras SV 20150 Eletroímã', 'Suporte Porta de Vidro Intelbras SV 20150 Usado Incompleto', 'Suporte Intelbras SV 20150, acessório que possibilita a instalação da fechadura eletroímã FE 20150 em portas de vidro. Unidades usadas e incompletas, mantidas em estoque apenas para controle e eventual aproveitamento de peças.
Principais recursos:
- Desenvolvido para a fechadura eletroímã Intelbras FE 20150 (150 kgf de força de tração)
- Facilidade de instalação
- Maior robustez na instalação em porta de vidro
- Indicado para portas de vidro com batente de vidro ou alvenaria
- Acabamento com pintura eletrostática prata
Especificações técnicas:
- Compatibilidade: fechadura eletroímã Intelbras FE 20150
- Acabamento: pintura eletrostática prata
- Aplicação: portas de vidro com batente de vidro ou alvenaria
Conteúdo: suporte incompleto (faltam componentes; conferir quais).
Aplicação: reposição de peças ou complemento de outro suporte SV 20150. Para portas de vidro, a Intelbras indica o uso do SV 20150 ou do kit dupla face junto à FE 20150.
Condição: produtos usados e incompletos. Itens não destinados à venda neste momento.', '{"Marca":"Intelbras","Modelo":"SV 20150","Tipo":"Suporte para fechadura eletroímã em porta de vidro","Compatibilidade":"Fechadura eletroímã Intelbras FE 20150","Acabamento":"Pintura eletrostática prata","Aplicação":"Portas de vidro com batente de vidro ou alvenaria"}'::jsonb, array['SV 20150', 'suporte FE 20150', 'suporte vidro fechadura eletroima', 'intelbras suporte porta vidro', 'suporte eletroima 150kg vidro']::text[], 'Ferramentas e Construção > Segurança para Casa > Fechaduras e Trancas > Acessórios para Fechaduras', 'Para a sua casa > Materiais de construção e jardim', 'Suporte incompleto, sem embalagem completa (2 unidades em estoque)', 'Sem garantia', null, null, null, null, null, null, null, null, array['https://www.intelbras.com/pt-br/suporte-para-fechadura-eletroima-fe-20150-sv-20150', 'https://backend.intelbras.com/sites/default/files/2026-06/Guia_FE%2020150_02-26_site_0.pdf', 'https://www.kabum.com.br/produto/647476/suporte-para-fechadura-em-portas-de-vidro-sv20150-intelbras-kit-de-instalacao-de-fechadura-em-portas-de-vidro-sv20150-intelbras']::text[], 'alta', 'Não é para venda (2 unidades incompletas). Verificar se as duas juntas formam um suporte completo.'),
  (37, 'Câmera Dome HDCVI 4MP Intelbras VHD 3420 D G6 Série 3000', 'VHD 3420 D G6 CÂMERA HDCVI SÉRIE 3000', 'Intelbras', 'VHD 3420 D G6', 'CFTV', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Câmera Dome Intelbras VHD 3420 D G6 4MP HDCVI 2,8mm IR 20m', 'Câmera Dome Intelbras VHD 3420 D G6 4MP HDCVI Infravermelho 20m Nova', 'Câmera dome Intelbras VHD 3420 D G6, da linha profissional Série 3000, com resolução de 4 Megapixels (1440p) e tecnologia HDCVI. Com acabamento metálico, é indicada para projetos que exigem maior robustez, entregando imagens nítidas de dia e de noite.
Principais recursos:
- Resolução 4 MP real (2560 x 1440)
- Sensor CMOS de 1/2.7 polegada
- Lente fixa de 2,8 mm com ângulo de visão horizontal de 101 graus
- Infravermelho com alcance de até 20 metros e IR inteligente
- Modo dia/noite automático (colorida de dia, preto e branco à noite)
- Alta sensibilidade: 0,03 lux (F2.0)
- Acabamento metálico, mais robusto
- Menu OSD para ajustes de imagem
Especificações técnicas:
- Tecnologia: HDCVI
- Resolução: 4 MP (1440p)
- Sensor: CMOS 1/2.7"
- Lente: 2,8 mm
- Ângulo de visão: 101 graus (H) / 54 graus (V)
- Infravermelho: 20 m, 3 LEDs 850 nm
- Temperatura de operação: -40 °C a 60 °C
Conteúdo da embalagem:
- 1 câmera VHD 3420 D G6
- Kit de fixação e manual
Aplicação: monitoramento de residências, comércios, condomínios e empresas em sistemas de CFTV com DVR compatível com HDCVI 4 MP (ex.: linha MHDX Intelbras).
Condição: produto novo, na embalagem.
Garanta imagens de alta definição com a qualidade e o suporte da Intelbras.', '{"Marca":"Intelbras","Modelo":"VHD 3420 D G6","Linha":"Série 3000","Formato":"Dome","Tecnologia":"HDCVI","Resolução":"4 MP (2560 x 1440)","Sensor":"CMOS 1/2.7\"","Lente":"2,8 mm","Ângulo de visão":"101° horizontal / 54° vertical","Alcance infravermelho":"20 m","LEDs IR":"3 LEDs 850 nm","Sensibilidade":"0,03 lux (F2.0)","Dia/Noite":"Automático","Acabamento":"Metálico","Temperatura de operação":"-40 °C a 60 °C"}'::jsonb, array['VHD 3420 D G6', 'camera dome intelbras 4mp', 'camera hdcvi 4mp', 'camera intelbras serie 3000', 'camera dome metalica intelbras', 'camera infravermelho 20m', 'cftv intelbras 1440p']::text[], 'Segurança para Casa > Câmeras de Segurança', 'Eletrônicos e celulares > Câmeras e acessórios', '1 câmera, kit de fixação, manual', '1 ano de garantia do fabricante', null, 0.5, 11, 13, 13, 219, 180, 300, array['https://www.intelbras.com/pt-br/camera-infravermelho-hdcvi-4mp-vhd-3420-d-g6', 'https://www.dicomp.com.br/downloads/materiais_apoio/datasheet/23090-1.pdf', 'https://backend.intelbras.com/sites/default/files/2021-08/Manual_VHD_3420D_3430B_G6_espanhol_01-21_site.pdf']::text[], 'alta', 'Preço estimado (não foi possível obter anúncios atuais do ML); conferir. Grau de proteção IP, alimentação e consumo não confirmados na ficha — checar etiqueta/caixa antes de anunciar.'),
  (38, 'Manopla de Câmbio Kia Cerato Koup Original', 'Manopla Cerato Koup (escrito ''Serato/sersto coup'')', 'Kia', 'Cerato Koup', 'Automotivo', 'usado', 1, true, 'olx', 'a_revisar', 'Condição (novo/usado) não informada — assumido usado, conferir', 'Manopla de Câmbio Kia Cerato Koup Original', 'Manopla de Câmbio Kia Cerato Koup Original Usada', 'Manopla de câmbio original do Kia Cerato Koup, peça de acabamento interno retirada do veículo. Ideal para quem precisa substituir uma manopla gasta, quebrada ou com o acabamento descascado, mantendo o visual original do interior do carro.
Principais características:
- Peça original Kia, mesmo encaixe e acabamento de fábrica
- Compatível com o Kia Cerato Koup (cupê vendido no Brasil por volta de 2010 a 2013)
- Devolve o aspecto original ao console central
- Instalação simples, sem necessidade de adaptações (conferir o tipo de câmbio)
Especificações:
- Veículo: Kia Cerato Koup
- Tipo de peça: manopla (bola) de câmbio
- Procedência: original
Conteúdo: 1 manopla de câmbio.
Aplicação: reposição em Kia Cerato Koup. Antes de comprar, confira se o seu carro tem o mesmo tipo de câmbio (automático ou manual) e compare pelas fotos do anúncio.
Condição: produto usado, em bom estado, conforme as fotos.
Tire suas dúvidas pelo chat antes de fechar o negócio.', '{"Marca do veículo":"Kia","Modelo do veículo":"Cerato Koup","Tipo de peça":"Manopla de câmbio","Procedência":"Original"}'::jsonb, array['manopla cerato koup', 'manopla cambio kia cerato', 'bola cambio cerato koup', 'peças cerato koup', 'kia koup acabamento interno', 'manopla kia original']::text[], 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Acabamento Interno > Manoplas de Câmbio', 'Autos e peças > Peças e acessórios > Carros, vans e utilitários', '1 manopla de câmbio', 'Sem garantia', null, 0.4, 12, 12, 18, 120, 70, 200, array['https://www.vrum.com.br/noticias/apos-pre-estreia-televisiva-kia-lanca-o-cupe-koup/', 'https://www.webmotors.com.br/carros/estoque/kia/cerato/20-koup-16v-gasolina-2p-automatico/precoate.300000']::text[], 'media', 'Confirmar se é novo ou usado, se é original, se é de câmbio automático ou manual e o ano do carro. Não foram achados anúncios específicos para referência de preço; valor é estimativa por peças similares.'),
  (39, 'Difusor de Ar (Saída de Ar do Painel) Kia Cerato Koup Original', 'Difusor de ar Cerato Koup (mesmo carro da manopla)', 'Kia', 'Cerato Koup', 'Automotivo', 'usado', 1, true, 'olx', 'a_revisar', 'Condição não informada — assumido usado, conferir', 'Difusor Saída de Ar Painel Kia Cerato Koup Original', 'Difusor Saída de Ar do Painel Kia Cerato Koup Original Usado', 'Difusor de ar (saída de ar do painel) original do Kia Cerato Koup, peça de acabamento interno retirada do veículo. Indicado para substituir difusores com aletas quebradas, travadas ou com o acabamento danificado, devolvendo o funcionamento e o visual original ao painel.
Principais características:
- Peça original Kia, encaixe de fábrica
- Compatível com o Kia Cerato Koup (cupê vendido no Brasil por volta de 2010 a 2013)
- Permite direcionar corretamente o fluxo de ar do ar-condicionado e da ventilação
- Instalação por encaixe no painel
Especificações:
- Veículo: Kia Cerato Koup
- Tipo de peça: difusor / saída de ar do painel
- Procedência: original
Conteúdo: 1 difusor de ar.
Aplicação: reposição em Kia Cerato Koup. Confira pelas fotos a posição da peça no painel (central, lado do motorista ou lado do passageiro) antes de comprar.
Condição: produto usado, em bom estado, conforme as fotos.
Tire suas dúvidas pelo chat antes de fechar o negócio.', '{"Marca do veículo":"Kia","Modelo do veículo":"Cerato Koup","Tipo de peça":"Difusor / saída de ar do painel","Procedência":"Original"}'::jsonb, array['difusor de ar cerato koup', 'saida de ar painel kia cerato', 'difusor kia cerato', 'peças cerato koup', 'aleta ar condicionado cerato', 'acabamento painel kia koup']::text[], 'Acessórios para Veículos > Peças de Carros e Caminhonetes > Acabamento Interno > Difusores de Ar', 'Autos e peças > Peças e acessórios > Carros, vans e utilitários', '1 difusor de ar', 'Sem garantia', null, 0.3, 10, 15, 20, 80, 50, 150, array['https://lista.mercadolivre.com.br/moldura-creta-pecas-interior-difusores-ar', 'https://www.webmotors.com.br/carros/estoque/kia/cerato/20-koup-16v-gasolina-2p-automatico/precoate.300000']::text[], 'media', 'Confirmar se é novo ou usado, se é original e qual posição do painel (central, esquerdo ou direito). Sem anúncios específicos para referência de preço; valor estimado.'),
  (40, 'Câmera PPA A408016', 'Câmera PPA A408016', 'PPA', 'A408016', 'Automação de Portões', 'novo', 2, false, 'nenhum', 'somente_estoque', 'Novas mas não para venda', 'Câmera PPA A408016', 'Câmera PPA A408016 Nova', 'Câmera da marca PPA (Motoppar, fabricante brasileira de automatizadores de portões, portas e cancelas), identificada pelo código A408016. Item novo mantido em estoque, não destinado à venda neste momento.
Informações conhecidas:
- Fabricante: PPA (Motoppar Indústria e Comércio de Automatizadores Ltda., Garça/SP)
- Código impresso: A408016
- Quantidade em estoque: 2 unidades novas
Especificações técnicas: não foi possível localizar ficha técnica pública para este código. O código pode ser um número interno de peça/SKU da PPA e não o nome comercial do modelo.
Aplicação provável: a PPA trabalha com automação de portões, portas e cancelas e acessórios de segurança para acesso de veículos e pedestres; a câmera deve ser um acessório dessa linha, mas o tipo exato (analógica, IP ou Wi-Fi), a resolução e a forma de alimentação precisam ser confirmados pela etiqueta ou pela embalagem do produto.
Conteúdo: a conferir na embalagem original.
Condição: produto novo, em estoque (2 unidades).
Item cadastrado apenas para controle de estoque, sem anúncio previsto no momento. Assim que o modelo comercial for confirmado, a ficha técnica e a descrição poderão ser completadas.', '{"Marca":"PPA","Código":"A408016"}'::jsonb, array['camera PPA', 'A408016', 'PPA automação', 'camera portao PPA', 'motoppar camera']::text[], 'Segurança para Casa > Câmeras de Segurança', 'Eletrônicos e celulares > Câmeras e acessórios', 'Conferir embalagem', 'Conferir com o fabricante', null, null, null, null, null, null, null, null, array['https://www.reclameaqui.com.br/empresa/ppa-portas-e-portoes-automaticas/sobre/', 'https://media.ppa.com.br/files/P30906_Manual_Triflex_Full_Range_REV10_1770812221431.pdf']::text[], 'baixa', 'Código A408016 não encontrado em nenhuma fonte pública. Enviar foto da etiqueta/caixa (nome comercial, resolução, tipo: analógica/IP/Wi-Fi) para identificar. Não é para venda.'),
  (41, 'Fonte de Alimentação Intelbras EF 1205 12,8V 5A AC/DC', 'intelbras fonte AC/DC 12,8 Vdc 5 A EF 1205', 'Intelbras', 'EF 1205', 'Energia', 'novo', 2, true, 'mercado_livre', 'a_revisar', null, 'Fonte Intelbras EF 1205 12,8V 5A Bivolt para CFTV', 'Fonte Intelbras EF 1205 12,8V 5A Bivolt para Câmeras CFTV Nova', 'Fonte de alimentação Intelbras EF 1205, modelo AC/DC tipo colmeia/notebook com saída de 12,8 Vdc e 5 A, ideal para sistemas de CFTV. A tensão de saída de 12,8 V compensa a queda de tensão em cabos longos, garantindo alimentação estável para as câmeras.
Principais recursos:
- Saída de 12,8 Vdc / 5 A
- Entrada automática de 100 a 240 Vac (bivolt), 50/60 Hz
- Alimenta até 20 câmeras HD
- Proteção contra curto-circuito, sobrecarga e sobretensão
- Filtro antirruído para imagens de CFTV mais limpas
- Saída com cabo e conector P4
- Garantia mantida mesmo com o conector P4 cortado (conforme ficha do fabricante)
Especificações técnicas:
- Entrada: 100 a 240 Vac automático, 50/60 Hz
- Saída: 12,8 Vdc
- Corrente máxima: 5 A
- Potência nominal: 64 W
- Dimensões aproximadas: 129 x 59 x 32,5 mm
Conteúdo da embalagem:
- 1 fonte EF 1205 com cabo de saída P4
Aplicação: alimentação de câmeras de segurança, DVRs, kits de CFTV, controle de acesso e outros equipamentos de 12 V até 5 A.
Condição: produto novo, na embalagem.
Uma fonte confiável e protegida para deixar seu sistema de segurança funcionando sem interrupções.', '{"Marca":"Intelbras","Modelo":"EF 1205","Tipo":"Fonte AC/DC chaveada","Tensão de entrada":"100 a 240 Vac automático","Frequência":"50/60 Hz","Tensão de saída":"12,8 Vdc","Corrente de saída":"5 A","Potência nominal":"64 W","Conector":"P4","Proteções":"Curto-circuito, sobrecarga e sobretensão","Filtro":"Antirruído","Capacidade":"Até 20 câmeras HD","Dimensões":"129 x 59 x 32,5 mm"}'::jsonb, array['fonte intelbras EF 1205', 'fonte 12v 5a intelbras', 'fonte 12,8v 5a', 'fonte cftv intelbras', 'fonte para camera 5a', 'fonte bivolt 12v 5a', 'fonte colmeia intelbras']::text[], 'Segurança para Casa > Câmeras de Segurança > Acessórios para Câmeras > Fontes', 'Eletrônicos e celulares > Câmeras e acessórios', '1 fonte EF 1205 com cabo P4', '2 anos de garantia do fabricante (conforme datasheet; conferir na embalagem)', null, 0.35, 5, 8, 16, 95, 80, 150, array['https://backend.intelbras.com/sites/default/files/2023-05/EF%201205%20-%20Datasheet%20%280523%29.pdf', 'https://www.dicomp.com.br/downloads/materiais_apoio/datasheet/18486-1.pdf', 'https://www.kabum.com.br/produto/457384/fonte-chaveada-intelbras-ef-1205s-tipo-notebook-12-8v-5a-sem-plug-tomada']::text[], 'alta', 'Confirmar se é EF 1205 (com plugue de tomada) ou EF 1205S (sem plugue) e o prazo de garantia impresso na caixa. Preço baseado na EF 1205S (Kabum ~R$ 115) e similares.'),
  (42, 'Fonte Metálica Intelbras EFM 1205 G2 12,8V 5A AC/DC', 'intelbras fonte AC/DC 12,8 Vdc 5 A EFM 1205', 'Intelbras', 'EFM 1205 G2', 'Energia', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Fonte Metálica Intelbras EFM 1205 G2 12,8V 5A Bivolt', 'Fonte Metálica Intelbras EFM 1205 12,8V 5A Bivolt CFTV Nova', 'Fonte de alimentação metálica Intelbras EFM 1205 G2, segunda geração da linha de fontes metálicas, com saída de 12,8 Vdc e 5 A. Ideal para centralizar a alimentação de sistemas de CFTV, controle de acesso e outros equipamentos 12 V, com saídas por borne e fixação em trilho DIN ou parede.
Principais recursos:
- Saída nominal de 12,8 Vdc / 5 A (64 W)
- Tensão de saída ajustável de 11,5 a 13,8 Vdc para compensar perdas nos cabos
- Entrada bivolt automática de 100 a 240 Vac (faixa 90 a 264 Vac)
- Alimenta até 20 câmeras HD
- Proteção contra curto-circuito, sobrecarga e sobretensão
- Proteção contra danos causados por descargas atmosféricas
- Filtro de ruído para imagens de CFTV mais limpas
- Saídas com bornes de parafuso
- Fixação em trilho DIN ou parede
Especificações técnicas:
- Entrada: 100 a 240 Vac (90 a 264 Vac), 47 a 63 Hz, corrente máx. 1,5 A
- Saída: 12,8 Vdc nominal, ajuste de 11,5 a 13,8 Vdc
- Corrente de saída: 0 a 5 A
- Potência nominal: 64 W
- Consumo sem carga: máximo 1 W
- Gabinete: metálico
Conteúdo da embalagem:
- 1 fonte EFM 1205 G2
Aplicação: racks e quadros de CFTV, kits de câmeras, controle de acesso, fechaduras e equipamentos de rede 12 V.
Condição: produto novo, na embalagem.
Robustez e segurança Intelbras para a alimentação do seu sistema.', '{"Marca":"Intelbras","Modelo":"EFM 1205 G2","Tipo":"Fonte AC/DC chaveada metálica","Tensão de entrada":"100 a 240 Vac (faixa 90 a 264 Vac)","Frequência":"50/60 Hz (47 a 63 Hz)","Corrente máxima de entrada":"1,5 A","Tensão de saída":"12,8 Vdc (ajustável 11,5 a 13,8 Vdc)","Corrente de saída":"0 a 5 A","Potência nominal":"64 W","Consumo sem carga":"1 W máx.","Conexão de saída":"Bornes de parafuso","Fixação":"Trilho DIN ou parede","Proteções":"Curto-circuito, sobrecarga, sobretensão e descargas atmosféricas","Capacidade":"Até 20 câmeras HD","Peso bruto":"300 g"}'::jsonb, array['fonte intelbras EFM 1205', 'EFM 1205 G2', 'fonte metalica 12v 5a', 'fonte colmeia 12,8v 5a', 'fonte cftv metalica intelbras', 'fonte trilho din 12v', 'fonte 12v 5a bivolt']::text[], 'Segurança para Casa > Câmeras de Segurança > Acessórios para Câmeras > Fontes', 'Eletrônicos e celulares > Câmeras e acessórios', '1 fonte EFM 1205 G2', '1 ano de garantia do fabricante', null, 0.3, 5, 10, 15, 85, 74, 160, array['https://www.intelbras.com/pt-br/fonte-acdc-128v-5a-metalica-efm-1205-g2', 'https://www.kabum.com.br/produto/520176/fonte-efm-1205-g2', 'https://backend.intelbras.com/sites/default/files/2025-01/Manual_EFM_1205_G2_01-24_site.pdf']::text[], 'media', 'Confirmar na etiqueta se é a versão G2 (12,8 V) ou a EFM 1205 antiga (12 V ajustável); a tensão 12,8 V informada indica G2. Kabum ~R$ 74-82, Magalu ~R$ 125-160.'),
  (43, 'Botoeira de Saída para Porta (Botão de Acionamento para Controle de Acesso)', 'botoeiras porta', null, null, 'Controle de Acesso', 'usado', 3, false, 'nenhum', 'somente_estoque', 'Usadas, não pra venda', 'Botoeira de Saída para Porta Controle de Acesso', 'Botoeira de Saída para Porta Controle de Acesso Usada', 'Botoeira de saída para porta, utilizada em sistemas de controle de acesso para liberar fechaduras elétricas, eletroímãs e fechos eletromagnéticos pelo lado interno do ambiente. Itens usados mantidos em estoque apenas para controle, não destinados à venda neste momento.
Principais características:
- Função: botão de requisição de saída para liberação de porta
- Uso com fechaduras eletroímã, fechaduras elétricas e controladores de acesso
- Instalação em parede ou caixa elétrica, próximo à porta
Especificações técnicas: marca, modelo, tipo de contato (NA/NF) e acabamento não informados; conferir nas peças.
Conteúdo: 3 botoeiras usadas.
Aplicação: saída de portas de escritórios, condomínios, clínicas e comércios com controle de acesso.
Condição: produtos usados. Itens cadastrados apenas para controle de estoque.', '{"Tipo":"Botoeira de saída / botão de acionamento de porta","Aplicação":"Controle de acesso (fechaduras eletroímã e elétricas)"}'::jsonb, array['botoeira de saida', 'botao de saida porta', 'botoeira controle de acesso', 'botao fechadura eletroima', 'push button porta']::text[], 'Segurança para Casa > Controle de Acesso > Botoeiras', 'Para a sua casa > Materiais de construção e jardim', '3 botoeiras usadas, sem embalagem', 'Sem garantia', null, null, null, null, null, null, null, null, '{}'::text[], 'baixa', 'Nome genérico: informar marca/modelo (ex.: Intelbras BT 3000/BT 1000 etc.), se são inox ou plástico, com ou sem moldura. Não é para venda.'),
  (44, 'Ramal DECT Intelbras TS 60 IPR para Central TS 60 IP', 'intelbras Terminal DECT TS 60 IPR', 'Intelbras', 'TS 60 IPR', 'Telefonia', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Ramal Telefone Sem Fio Intelbras TS 60 IPR DECT p/ TS 60 IP', 'Ramal Telefone Sem Fio Intelbras TS 60 IPR DECT para TS 60 IP Novo', 'Ramal DECT Intelbras TS 60 IPR, fone adicional desenvolvido exclusivamente para uso com a microcentral TS 60 IP, sistema de telefonia híbrido (linha analógica e VoIP) da Intelbras. Ideal para ampliar o atendimento em escritórios, consultórios e residências que já utilizam a TS 60 IP.
Principais recursos:
- Tecnologia DECT 1,9 GHz, livre de interferências de redes Wi-Fi
- Uso exclusivo com a microcentral Intelbras TS 60 IP (o sistema suporta até cinco fones)
- Viva-voz no fone
- Identificador de chamadas
- Agenda para até 70 nomes/números
- Registro de chamadas: 10 recebidas, 10 não atendidas e 10 originadas
- Bateria recarregável com base carregadora
Especificações técnicas:
- Frequência: DECT 1,9 GHz
- Bateria: 2,4 Vdc, 600 mAh
- Autonomia: aproximadamente 200 h em repouso e 5 h em conversação
- Tempo de carga: aproximadamente 10 h
- Compatibilidade: microcentral Intelbras TS 60 IP
Conteúdo da embalagem:
- 1 fone TS 60 IPR
- 1 base carregadora com fonte
- Bateria e manual
Aplicação: expansão de ramais em sistemas com a central TS 60 IP, permitindo transferência e atendimento de chamadas em diferentes ambientes.
Condição: produto novo, na embalagem. Modelo descontinuado pela Intelbras, oportunidade para quem precisa completar o sistema existente.
Importante: este ramal não funciona sozinho, nem em outras bases; requer a central TS 60 IP.', '{"Marca":"Intelbras","Modelo":"TS 60 IPR","Tipo":"Ramal DECT (fone adicional)","Compatibilidade":"Microcentral Intelbras TS 60 IP (exclusivo)","Frequência":"DECT 1,9 GHz","Viva-voz":"Sim","Identificador de chamadas":"Sim","Agenda":"70 nomes/números","Registro de chamadas":"10 recebidas, 10 não atendidas, 10 originadas","Bateria":"2,4 Vdc 600 mAh","Autonomia em repouso":"Aprox. 200 h","Autonomia em conversação":"Aprox. 5 h","Tempo de carga":"Aprox. 10 h","Status":"Descontinuado pelo fabricante"}'::jsonb, array['TS 60 IPR', 'ramal TS 60 IP', 'ramal dect intelbras', 'telefone sem fio intelbras voip', 'fone adicional TS 60', 'ramal sem fio intelbras', 'central TS 60 IP']::text[], 'Celulares e Telefones > Telefonia Fixa e Sem Fio > Telefones Sem Fio', 'Eletrônicos e celulares > Telefones e acessórios', '1 fone, 1 base carregadora com fonte, bateria, manual', '1 ano de garantia do fabricante', null, 0.5, 8, 14, 22, 169, 130, 250, array['https://www.intelbras.com/pt-br/ramal-dect-para-central-ts-60-ip-ts-60-ipr', 'https://backend.intelbras.com/sites/default/files/2026-02/Guia_TS_60_IP-TS_60_IP_R_01-26_site.pdf', 'https://backend.intelbras.com/sites/default/files/2020-02/Manual-do-usuario-TS-60-IP-TS-60-IP-R-01.20.pdf']::text[], 'alta', 'Produto descontinuado e sem anúncios de referência encontrados: preço é estimativa, conferir. Confirmar conteúdo da caixa e se a garantia ainda é válida (data de fabricação).'),
  (45, 'Placa Fonte Chaveada para Central de Comunicação Condominial CP 48 e CP 112 Intelbras', 'PLACA FONTE CHAV. CP 48/112', 'Intelbras', 'Placa Fonte Chaveada CP 48 / CP 112', 'Telefonia', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Placa Fonte Chaveada Central Intelbras CP 48 CP 112', 'Placa Fonte Chaveada Intelbras para Central CP 48 / CP 112 - Nova', 'Placa fonte chaveada original Intelbras (linha Maxcom) para centrais de comunicação condominial CP 48 e CP 112. Peça nova, ideal para reposição ou manutenção de centrais de interfonia de condomínios, devolvendo a alimentação correta ao sistema e garantindo o funcionamento de ramais, porteiros e placas de serviço.

Principais recursos:
- Placa de alimentação (fonte chaveada) própria para as centrais CP 48 e CP 112
- Peça original do fabricante, com código de fábrica 4920442
- Indicada para reposição em manutenção corretiva ou preventiva
- Encaixe no gabinete da central, sem adaptações
- Fonte chaveada: maior eficiência e menor aquecimento em relação a fontes lineares

Especificações técnicas:
- Marca: Intelbras (Maxcom)
- Tipo: placa fonte chaveada
- Compatibilidade: centrais de comunicação condominial CP 48 e CP 112 (anúncios do mercado também citam COMUNIC 16 e COMUNIC 48)
- Código de fábrica: 4920442

Conteúdo da embalagem:
- 1 placa fonte chaveada CP 48 / CP 112

Aplicação:
Indicada para técnicos, instaladores e síndicos que precisam substituir a fonte de uma central de interfonia CP 48 ou CP 112 com defeito, ou manter uma peça de reserva para atendimento rápido em condomínios.

Condição: produto novo, na embalagem.

Antes de comprar, confira o modelo da sua central. Em caso de dúvida, envie uma pergunta que respondemos com prazer.', '{"Marca":"Intelbras (Maxcom)","Tipo":"Placa fonte chaveada","Compatibilidade":"Centrais de comunicação condominial CP 48 e CP 112","Código de fábrica":"4920442","Condição":"Novo"}'::jsonb, array['placa fonte cp 48', 'fonte cp 112', 'placa fonte chaveada intelbras', 'fonte central interfone condominio', 'maxcom cp 48', 'maxcom cp 112', 'fonte central cp intelbras', 'placa central interfonia']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Interfones e Porteiros > Peças e Acessórios', 'Eletrônicos e celulares > Telefones e acessórios', '1 placa fonte chaveada CP 48 / CP 112', 'Garantia do fabricante (confirmar prazo, normalmente 1 ano Intelbras)', null, 0.5, 6, 15, 22, 369, 340, 543, array['https://www.condufibra.com.br/produto/placa-fonte-chaveada-cp-48-cp-112-c-emb/', 'https://www.duetec.com.br/produto/placa-fonte-cp-48-112-intelbras/', 'https://lista.mercadolivre.com.br/placa-fonte-maxcom-cp-48-e-cp-112', 'https://backend.intelbras.com/sites/default/files/integration/manual_do_usuario_cp_48_e_cp_112.pdf']::text[], 'media', 'Confirmar na etiqueta da placa o código (4920442) e a compatibilidade; tensões/potência da fonte não foram encontradas em ficha oficial. Garantia e dimensões são estimadas.'),
  (46, 'Módulo SFP GPON Classe C+ Monomodo 20 km Intelbras KPSD 1120 G C+', 'módulo SFP GPON classe C+ Monomodo 20 km KPSD 1120 G C+', 'Intelbras', 'KPSD 1120 G C+', 'Redes', 'novo', 3, true, 'mercado_livre', 'a_revisar', null, 'Módulo SFP GPON C+ Intelbras KPSD 1120 G C+ 20km SC/PC', 'Módulo SFP GPON Classe C+ Intelbras KPSD 1120 G C+ 20 km - Novo', 'Módulo SFP GPON Intelbras KPSD 1120 G C+, classe óptica C+, para fibra monomodo com alcance de até 20 km. Projetado para portas PON de OLTs, oferece maior orçamento óptico que os módulos B+, permitindo atender mais clientes por porta e distâncias maiores com divisores de maior razão.

Principais recursos:
- Classe do laser C+ para maior alcance e margem óptica
- Taxa de 2,488 Gbps downstream e 1,244 Gbps upstream
- Alcance de até 20 km em fibra monomodo 9/125 um
- Conector SC/PC simplex (1 fibra)
- Plug and play e hot swap (troca a quente)
- Suporte a RSSI e DDMI para monitoramento do sinal óptico
- Compatível com as OLTs Intelbras 8820 I, G16 e G08

Especificações técnicas:
- Padrão: ITU-T G.984.2
- Comprimento de onda: Tx 1490 nm (downstream) / Rx 1310 nm (upstream)
- Potência de transmissão: 3 dBm a 8 dBm
- Sensibilidade de recepção: -8 dBm (máx.) a -30 dBm (mín.)
- Precisão RSSI: +/- 3 dB
- Alimentação: 3,1 a 3,5 Vdc, 500 mA (provida pela OLT)
- Consumo máximo: 1,75 W
- Temperatura de operação: -40 a 85 graus C
- Umidade de operação: 0% a 85%
- Dimensões: 13 x 14 x 65 mm
- Peso: 22 g

Conteúdo da embalagem:
- 1 módulo SFP GPON KPSD 1120 G C+
- Guia de instalação

Aplicação:
Ideal para provedores de internet (ISP) que operam redes GPON e precisam expandir ou substituir módulos das portas PON da OLT, com mais alcance e melhor margem de potência.

Condição: produto novo, lacrado.

Temos 3 unidades disponíveis. Em caso de dúvida sobre compatibilidade com sua OLT, envie uma pergunta.', '{"Marca":"Intelbras","Modelo":"KPSD 1120 G C+","Padrão":"ITU-T G.984.2","Tipo":"SFP GPON (OLT)","Classe óptica":"C+","Conector de fibra":"SC/PC simplex","Fibra suportada":"Monomodo 9/125 um","Alcance":"Até 20 km","Comprimento de onda":"Tx 1490 nm / Rx 1310 nm","Taxa de transferência":"2,488 Gbps down / 1,244 Gbps up","Potência de transmissão":"3 a 8 dBm","Sensibilidade de recepção":"-8 a -30 dBm","DDMI/RSSI":"Sim","Hot swap":"Sim","Alimentação":"3,1 a 3,5 Vdc - 500 mA","Consumo máximo":"1,75 W","Temperatura de operação":"-40 a 85 °C","Dimensões (L x A x P)":"13 x 14 x 65 mm","Peso":"22 g","Compatibilidade":"OLTs Intelbras 8820 I, G16 e G08"}'::jsonb, array['sfp gpon c+', 'kpsd 1120 g c+', 'modulo sfp gpon intelbras', 'sfp olt intelbras', 'gbic gpon c+', 'sfp 20km sc pc', 'modulo gpon classe c+', 'sfp olt 8820i']::text[], 'Informática > Conectividade e Redes > Módulos SFP', 'Eletrônicos e celulares > Computadores e acessórios', '1 módulo SFP KPSD 1120 G C+, guia de instalação', '1 ano de garantia do fabricante', null, 0.08, 3, 6, 12, 279, 260, 595, array['https://backend.intelbras.com/sites/default/files/2022-08/Datasheet%20KPSD%201120G%20C+.pdf', 'https://www.intelbras.com/pt-br/modulo-sfp-gpon-c-monomodo-20-km-kpsd-1120-g-c', 'https://www.mercadolivre.com.br/modulo-sfp-kpsd-1120-g-c-conversor-interface-gpon-intelbras/p/MLB31959953', 'https://www.eletronicasantana.com.br/conversor-de-interface-eth-interf--gpon-c--kpsd-1120-g-4780050-intelbras/p']::text[], 'alta', 'Quantidade 3: decidir se anuncia unitário ou em kit. Preço ML de referência R$ 314,90.'),
  (47, 'Sensor de Presença para Iluminação Intelbras ESPi 360 A', 'intelbras sensor de presença para iluminação ESPI 360 A', 'Intelbras', 'ESPi 360 A', 'Energia', 'novo', 2, true, 'mercado_livre', 'a_revisar', null, 'Sensor de Presença Iluminação Intelbras ESPi 360 A Bivolt', 'Sensor de Presença para Iluminação Intelbras ESPi 360 A - Novo', 'Sensor de presença para iluminação Intelbras ESPi 360 A, de sobrepor e articulado, para instalação em teto ou parede. Acende a lâmpada automaticamente ao detectar movimento e apaga após o tempo programado, trazendo conforto, praticidade e economia de energia.

Principais recursos:
- Detecção de 360 graus com alcance de até 10 m
- Bivolt automático (100 a 240 Vac)
- Instalação em teto ou parede, modelo articulado
- Ajuste do tempo de lâmpada acesa: 10 s, 30 s, 1 min, 5 min ou 10 min
- Fotocélula com modo sol (dia e noite) ou lua (somente à noite)
- Ideal para corredores, garagens, escadas, halls e áreas de serviço

Especificações técnicas:
- Tensão de alimentação: 100 a 240 Vac, 50/60 Hz (bivolt automático)
- Ângulo de detecção: 360 graus
- Distância de detecção: 0 a 10 m (a 24 graus C)
- Altura de instalação: 2,2 a 4 m
- Temperatura de operação: 0 a 40 graus C
- Fator de potência da lâmpada: FP maior ou igual a 0,7
- Grau de proteção: IP20 (uso interno)

Conteúdo da embalagem:
- 1 sensor de presença ESPi 360 A
- Manual de instalação

Aplicação:
Indicado para ambientes internos ou abrigados de chuva e sol, como residências, condomínios, escritórios e comércios que buscam reduzir o consumo de energia com iluminação automática.

Condição: produto novo, na embalagem original.

Temos 2 unidades disponíveis. Dúvidas sobre instalação? Envie sua pergunta.', '{"Marca":"Intelbras","Modelo":"ESPi 360 A","Tipo":"Sensor de presença para iluminação, de sobrepor articulado","Tensão":"100 a 240 Vac 50/60 Hz (bivolt automático)","Ângulo de detecção":"360°","Alcance":"Até 10 m (a 24 °C)","Altura de instalação":"2,2 a 4 m","Tempos de acionamento":"10 s, 30 s, 1 min, 5 min, 10 min","Fotocélula":"Sim (modo sol / lua)","Fator de potência da lâmpada":"FP >= 0,7","Temperatura de operação":"0 a 40 °C","Grau de proteção":"IP20 (interno)","Instalação":"Teto ou parede"}'::jsonb, array['sensor de presença intelbras', 'espi 360 a', 'sensor presença iluminação', 'sensor de presença teto', 'sensor 360 graus bivolt', 'interruptor sensor presença', 'sensor luz automático']::text[], 'Casa, Móveis e Decoração > Iluminação Residencial > Sensores de Movimento', 'Para a sua casa > Materiais de construção e jardim', '1 sensor ESPi 360 A, manual', 'Garantia do fabricante Intelbras (confirmar prazo na embalagem)', null, 0.15, 6, 9, 12, 32, 26, 37, array['https://loja.intelbras.com.br/interruptor-presenca-espi-360a/p', 'https://www.mercadolivre.com.br/interruptor-sensor-de-presenca-p-iluminaco-espi-360-a-pt/p/MLB22798192', 'https://www.pichau.com.br/sensor-de-presenca-para-iluminacao-intelbras-espi-360-a-branco-espi-360-a', 'https://www.kabum.com.br/produto/169827/sensor-de-presenca-intelbras-deteccao-ate-10m-para-iluminacao-espi-360-a-branco']::text[], 'alta', 'Confirmar cor (branco ou preto) e prazo de garantia na embalagem. Considerar vender as 2 unidades em kit.'),
  (48, 'Sensor de Movimento Infravermelho Passivo de Teto Intelbras IVP 3011 Teto', 'sensor de movimento infravermelho passivo para teto IVP 3011 Teto', 'Intelbras', 'IVP 3011 Teto', 'Alarme e Sensores', 'novo', 1, true, 'mercado_livre', 'pronto', null, 'Sensor Infravermelho de Teto Intelbras IVP 3011 Teto 360', 'Sensor de Movimento Infravermelho de Teto Intelbras IVP 3011 - Novo', 'Sensor de movimento infravermelho passivo Intelbras IVP 3011 Teto, com fio, para instalação no teto e cobertura de 360 graus. Discreto e eficiente, é ideal para proteger salas, lojas, escritórios e ambientes onde a instalação em parede não é a melhor opção.

Principais recursos:
- Cobertura de 360 graus com 7 m de diâmetro
- Instalação no teto, com visual discreto
- Ajuste de contagem de pulsos (1P, 2P, 3P) para regular a sensibilidade
- Saída de alarme NA/NF
- Chave tamper (antiviolação) NF
- Compatível com centrais de alarme com fio de 12 Vdc

Especificações técnicas:
- Tensão de alimentação: 12 Vdc
- Consumo: até 18 mA
- Área de detecção: 7 m de diâmetro
- Ângulo de detecção: 360 graus
- Altura de instalação recomendada: 3 m
- Saída de alarme: NA/NF (500 mA, 100 Vdc)
- Tempo de estabilização: 60 s
- Temperatura de operação: -10 a 60 graus C
- Dimensões: diâmetro 86 x 25 mm

Conteúdo da embalagem:
- 1 sensor IVP 3011 Teto
- Manual de instalação

Aplicação:
Indicado para sistemas de alarme residenciais e comerciais, em ambientes internos, instalado no centro do teto para proteção de toda a área ao redor.

Condição: produto novo, na embalagem.

Ficou com alguma dúvida sobre compatibilidade com sua central? Envie sua pergunta.', '{"Marca":"Intelbras","Modelo":"IVP 3011 Teto","Tipo":"Sensor infravermelho passivo com fio, de teto","Tensão":"12 Vdc","Consumo":"<= 18 mA","Área de detecção":"7 m de diâmetro","Ângulo":"360°","Altura de instalação":"3 m (recomendada)","Saída de alarme":"NA/NF (500 mA, 100 Vdc)","Tamper":"Sim (NF)","Contagem de pulsos":"1P, 2P, 3P","Tempo de estabilização":"60 s","Temperatura de operação":"-10 a 60 °C","Dimensões":"Ø 86 x 25 mm"}'::jsonb, array['ivp 3011 teto', 'sensor infravermelho teto', 'sensor alarme teto 360', 'sensor presença alarme intelbras', 'sensor ivp intelbras com fio', 'sensor movimento teto']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Alarmes e Sensores > Sensores', 'Eletrônicos e celulares > Outros itens', '1 sensor IVP 3011 Teto, manual', '1 ano de garantia do fabricante', null, 0.15, 5, 11, 11, 135, 102, 200, array['https://backend.intelbras.com/sites/default/files/integration/datasheet_ivp_3011_teto_intelbras.pdf', 'https://www.intelbras.com/pt-br/sensor-de-movimento-infravermelho-passivo-ivp-3011-teto', 'https://www.mercadolivre.com.br/sensor-de-movimento-infravermelho-teto-ivp-3011-intelbras/p/MLB28397118', 'https://www.kabum.com.br/produto/218535/sensor-de-presenca-infra-angulo-360-ivp-3011-teto-intelbras']::text[], 'alta', null),
  (49, 'Fechadura Elétrica de Cilindro Fixo Intelbras FX 2000 Cinza', 'FX 2000 CINZA FECHADURA ELETRICA DE CILINDRO FIXO', 'Intelbras', 'FX 2000 (cilindro fixo)', 'Fechaduras e Acessórios', 'novo', 2, true, 'mercado_livre', 'a_revisar', null, 'Fechadura Elétrica Intelbras FX 2000 Cilindro Fixo Cinza 12V', 'Fechadura Elétrica Intelbras FX 2000 Cilindro Fixo Cinza - Nova', 'Fechadura elétrica Intelbras FX 2000 de cilindro fixo, acabamento cinza, de sobrepor. Robusta e confiável, é a escolha ideal para portões e portas de pedestres integrados a porteiros eletrônicos, videoporteiros e controladores de acesso.

Principais recursos:
- Acionamento elétrico em 12 V (AC/DC)
- Cilindro fixo de 40 mm
- Trinco reversível: montagem com abertura para dentro ou para fora, à direita ou à esquerda
- Modelo de sobrepor, para portas e portões de madeira ou metal
- Compatível com porteiros eletrônicos, videoporteiros e controladores de acesso
- Abertura também por chave

Especificações técnicas:
- Marca: Intelbras
- Modelo: FX 2000 cilindro fixo
- Cor: cinza
- Alimentação: 12 V AC/DC
- Potência: 10 W
- Cilindro: fixo, 40 mm
- Tipo de instalação: sobrepor
- Uso: ambientes internos e externos cobertos

Conteúdo da embalagem:
- 1 fechadura elétrica FX 2000
- 1 batente (contra-testa)
- Chaves
- Guia de instalação

Aplicação:
Indicada para portões sociais de residências, condomínios, comércios e empresas. Recomenda-se instalação em local coberto e manutenção preventiva a cada 6 meses, conforme orientação do fabricante.

Condição: produto novo, na embalagem.

Temos 2 unidades disponíveis. Em caso de dúvida sobre a instalação, envie sua pergunta.', '{"Marca":"Intelbras","Modelo":"FX 2000 cilindro fixo","Cor":"Cinza","Tipo":"Fechadura elétrica de sobrepor","Alimentação":"12 V AC/DC","Potência":"10 W","Cilindro":"Fixo, 40 mm","Trinco":"Reversível (dentro/fora, direita/esquerda)","Material":"Aço carbono","Uso":"Interno e externo coberto"}'::jsonb, array['fechadura eletrica intelbras', 'fx 2000', 'fx2000 cinza', 'fechadura eletrica cilindro fixo', 'fechadura portao 12v', 'fechadura eletrica sobrepor', 'fechadura para interfone']::text[], 'Ferramentas e Construção > Portas e Janelas > Fechaduras > Fechaduras Elétricas', 'Para a sua casa > Materiais de construção e jardim', '1 fechadura FX 2000, 1 batente, chaves, guia de instalação', '1 ano de garantia do fabricante', null, 1.7, 14, 14, 20, 289, 234, 390, array['https://backend.intelbras.com/sites/default/files/2020-09/guia-de-instalacao-FX-2000-UN-v2.pdf', 'https://www.telhanorte.com.br/fechadura-eletrica-cilindro-fixo-fx2000-cinza-intelbras-1571648/p', 'https://lista.mercadolivre.com.br/fechadura-eletrica-intelbras-fx-2000', 'https://www.kabum.com.br/produto/121583/fechadura-eletrica-com-trinco-reversivel-e-tambor-substituivel-cinza-intelbras-fx-2000']::text[], 'alta', 'Conferir na embalagem a quantidade de chaves inclusas e se é a versão 12 V.'),
  (50, 'Sensor de Movimento Infravermelho com Micro-ondas Intelbras IVP 5311 MW PET', 'IVP 5311 MW PET SENSOR', 'Intelbras', 'IVP 5311 MW PET', 'Alarme e Sensores', 'novo', 1, true, 'mercado_livre', 'pronto', null, 'Sensor Infravermelho Micro-ondas Intelbras IVP 5311 MW Pet', 'Sensor Alarme Intelbras IVP 5311 MW PET Micro-ondas - Novo', 'Sensor de movimento Intelbras IVP 5311 MW PET, com tripla tecnologia: infravermelho passivo (pirossensor), micro-ondas e imunidade a animais de até 20 kg. Ideal para ambientes semiabertos e locais onde se exige menos disparos falsos e maior confiabilidade.

Principais recursos:
- Detecção por infravermelho e micro-ondas combinados (lógica AND), reduzindo alarmes falsos
- Imunidade a animais de até 20 kg (PET)
- Alcance de 12 m com ângulo de 90 graus
- 5 ajustes de sensibilidade e 4 ajustes de pulso
- Função anticamuflagem
- Chave tamper (antiviolação)
- Saída de alarme NA ou NF

Especificações técnicas:
- Tensão de operação: 9 a 16 Vdc
- Consumo: 38 mA
- Alcance: 12 m
- Ângulo de detecção: 90 graus
- Imunidade a pets: até 20 kg
- Tempo de estabilização: 80 s
- Altura máxima de instalação: 2,20 m
- Temperatura de operação: -10 a +50 graus C
- Dimensões: 55 x 140 x 60 mm
- Peso: 0,11 kg
- Conexão: com fio

Conteúdo da embalagem:
- 1 sensor IVP 5311 MW PET
- Manual de instalação

Aplicação:
Indicado para residências com animais de estimação, garagens, varandas, depósitos e ambientes semiabertos, integrado a centrais de alarme com fio.

Condição: produto novo, na embalagem.

Dúvidas sobre a compatibilidade com sua central de alarme? Envie sua pergunta.', '{"Marca":"Intelbras","Modelo":"IVP 5311 MW PET","Código Intelbras":"4541019","Tecnologia":"Pirossensor + micro-ondas + PET immunity","Lógica de detecção":"MW e PIR (AND)","Alcance":"12 m","Ângulo":"90°","Imunidade a pets":"Até 20 kg","Ajustes de sensibilidade":"5","Ajustes de pulso":"4","Saída de alarme":"NA ou NF","Anticamuflagem":"Sim","Tamper":"Sim","Tensão":"9 a 16 Vdc","Consumo":"38 mA","Tempo de estabilização":"80 s","Altura máxima de instalação":"2,20 m","Temperatura de operação":"-10 a +50 °C","Dimensões":"55 x 140 x 60 mm","Peso":"0,11 kg","Conexão":"Com fio"}'::jsonb, array['ivp 5311 mw pet', 'sensor micro-ondas intelbras', 'sensor dupla tecnologia', 'sensor pet 20kg', 'sensor alarme com fio intelbras', 'sensor infravermelho pet', 'sensor anticamuflagem']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Alarmes e Sensores > Sensores', 'Eletrônicos e celulares > Outros itens', '1 sensor IVP 5311 MW PET, manual', '1 ano de garantia do fabricante', null, 0.2, 8, 8, 17, 169, 158, 191, array['https://backend.intelbras.com/sites/default/files/2023-08/Datasheet-IVP-5311-MW-PET_0.pdf', 'https://backend.intelbras.com/sites/default/files/2024-10/Manual_IVP_5311_MW_Pet_01-24_site.pdf', 'https://www.mercadolivre.com.br/sensor-infravermelho-passivo-intelbras-ivp-5311-mw-pet/p/MLB38157085', 'https://www.casadasegurancacambe.com.br/alarme/sensores/ivp/sensor-infravermelho-passivo-de-micro-ondas-ivp-5311-mw-pet-intelbras']::text[], 'alta', null),
  (51, 'Sensor de Movimento Infravermelho Passivo Intelbras IVP 3000 CF', 'IVP 300 CF', 'Intelbras', 'IVP 3000 CF', 'Alarme e Sensores', 'novo', 1, false, 'nenhum', 'somente_estoque', 'Estoque, não venda', 'Sensor Infravermelho Passivo Intelbras IVP 3000 CF Com Fio', 'Sensor Infravermelho Passivo Intelbras IVP 3000 CF - Novo', 'Sensor de movimento infravermelho passivo Intelbras IVP 3000 CF, com fio, para uso interno. Modelo de ótimo custo-benefício, com instalação direta na parede e cobertura ampla de 115 graus, muito utilizado em sistemas de alarme residenciais e comerciais.

Principais recursos:
- Alcance de 12 m com ângulo de proteção de 115 graus
- Infravermelho passivo de duplo elemento
- Compensação automática de temperatura
- 2 níveis de sensibilidade
- Inclinação vertical de 15 graus, fixação direta na parede
- Estabilização em apenas 40 segundos

Especificações técnicas:
- Tensão de operação: 9 a 18 Vdc
- Consumo: até 5 mA
- Alcance: 12 m
- Ângulo de detecção: 115 graus
- Método de detecção: PIR
- Saída de alarme: NF
- Tempo de inicialização: 40 s
- Dimensões: 70 x 96 x 65 mm
- Aplicação: ambientes internos

Conteúdo da embalagem:
- 1 sensor IVP 3000 CF
- Manual de instalação

Aplicação:
Indicado para proteção de salas, quartos, corredores e escritórios em sistemas de alarme com fio, como as centrais Intelbras ANM e AMT.

Condição: produto novo, na embalagem.

Dúvidas? Envie sua pergunta.', '{"Marca":"Intelbras","Modelo":"IVP 3000 CF","Tipo":"Sensor infravermelho passivo com fio","Alcance":"12 m","Ângulo":"115°","Sensibilidade":"2 níveis","Saída de alarme":"NF","Tensão":"9 a 18 Vdc","Consumo":"Até 5 mA","Tempo de inicialização":"40 s","Dimensões":"70 x 96 x 65 mm","Aplicação":"Ambientes internos"}'::jsonb, array['ivp 3000 cf', 'sensor infravermelho intelbras', 'sensor alarme com fio', 'sensor ivp 3000', 'sensor de presença alarme', 'sensor passivo 12m']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Alarmes e Sensores > Sensores', 'Eletrônicos e celulares > Outros itens', '1 sensor IVP 3000 CF, manual', '1 ano de garantia do fabricante', null, 0.15, 8, 8, 12, null, null, null, array['https://backend.intelbras.com/sites/default/files/2020-08/datasheet-IVP-3000-CF-v2.pdf', 'https://www.intelbras.com/pt-br/sensor-de-movimento-infravermelho-passivo-ivp-3000-cf', 'https://www.kabum.com.br/produto/209628/sensor-de-presenca-intelbras-infravermelho-deteccao-ate-12m-passivo-ivp-3000-cf']::text[], 'media', 'Item NÃO é para venda (estoque). Nome digitado ''IVP 300 CF'' interpretado como IVP 3000 CF (não existe IVP 300 CF); conferir etiqueta. Referência de preço avulso ~R$ 41.'),
  (52, 'Botoeira de Saída Simples com Fio para Controle de Acesso', 'Botoeira simples com fio', 'Genérica', null, 'Controle de Acesso', 'novo', 1, false, 'nenhum', 'somente_estoque', 'Para estoque', 'Botoeira de Saída Simples com Fio para Controle de Acesso', 'Botoeira de Saída com Fio para Fechadura e Controle de Acesso - Nova', 'Botoeira de saída simples com fio, para liberação de portas e portões em sistemas de controle de acesso, fechaduras elétricas, eletroímãs e fechos eletromagnéticos. Permite que o usuário, do lado interno, abra a porta com um simples toque no botão.

Principais recursos:
- Acionamento por botão de pressão (pulsador)
- Ligação com fio, simples e rápida
- Compatível com controladores de acesso, porteiros eletrônicos, fechaduras elétricas e eletroímãs que possuam entrada para botão de saída
- Uso interno

Especificações técnicas:
- Tipo: botoeira de saída (botão de requisição de saída)
- Conexão: com fio
- Contato: a confirmar no produto (normalmente NA, podendo ter NA/NF)

Conteúdo da embalagem:
- 1 botoeira de saída

Aplicação:
Indicada para portas de escritórios, salas, condomínios, clínicas e comércios que utilizam controle de acesso, fechadura elétrica ou eletroímã e precisam de um comando local para liberar a saída.

Condição: produto novo.

Antes de comprar, confira se o seu equipamento possui entrada para botão de saída. Dúvidas? Envie sua pergunta.', '{"Tipo":"Botoeira de saída simples","Conexão":"Com fio","Uso":"Interno","Condição":"Novo"}'::jsonb, array['botoeira de saída', 'botão de saída controle de acesso', 'botoeira fechadura eletrica', 'botoeira eletroima', 'botão abertura porta', 'botoeira com fio']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Controle de Acesso > Botoeiras', 'Eletrônicos e celulares > Outros itens', '1 botoeira de saída', 'Sem garantia de fabricante (produto genérico)', null, 0.1, 4, 9, 12, null, null, null, '{}'::text[], 'baixa', 'Item NÃO é para venda (estoque). Produto genérico sem marca/modelo: conferir marca, tipo de contato (NA/NF), material e se é de sobrepor ou embutir.'),
  (53, 'Eletroímã para Porta (Fecho Eletromagnético) Usado', 'Eletroímã para porta', 'Genérica', null, 'Fechaduras e Acessórios', 'usado', 1, false, 'nenhum', 'somente_estoque', 'Usado completo, sem venda, só estoque', 'Eletroímã para Porta Fecho Eletromagnético 12V Usado', 'Eletroímã para Porta Fecho Eletromagnético Completo - Usado', 'Eletroímã para porta (fecho eletromagnético), usado e completo, para trancamento de portas em sistemas de controle de acesso. Funciona mantendo a porta fechada por força magnética enquanto energizado e liberando a passagem quando a alimentação é cortada pelo controlador, botoeira ou porteiro.

Principais recursos:
- Trancamento por força magnética, sem partes móveis
- Funcionamento silencioso
- Compatível com controladores de acesso, botoeiras de saída e porteiros eletrônicos
- Libera a porta na falta de energia (modo falha segura), característica comum a esse tipo de fecho

Especificações técnicas:
- Tipo: eletroímã / fecho eletromagnético para porta
- Alimentação: a confirmar na etiqueta (normalmente 12 Vdc)
- Força de retenção: a confirmar na etiqueta
- Conjunto: corpo do eletroímã e placa de contato (armadura)

Conteúdo:
- 1 eletroímã com placa de contato (conjunto completo)

Aplicação:
Indicado para portas de vidro, madeira ou metal em escritórios, clínicas, condomínios e comércios que utilizam controle de acesso.

Condição: produto usado, completo, testado e funcionando.

Dúvidas? Envie sua pergunta.', '{"Tipo":"Eletroímã / fecho eletromagnético para porta","Conjunto":"Completo (corpo + placa de contato)","Condição":"Usado"}'::jsonb, array['eletroima porta', 'fecho eletromagnetico', 'eletroima controle de acesso', 'eletroima 12v', 'trava magnetica porta', 'eletroima usado']::text[], 'Ferramentas e Construção > Portas e Janelas > Fechaduras > Fechaduras Eletromagnéticas', 'Para a sua casa > Materiais de construção e jardim', '1 eletroímã com placa de contato', 'Sem garantia', null, 1.5, 8, 10, 30, null, null, null, '{}'::text[], 'baixa', 'Item NÃO é para venda (só estoque). Produto genérico: conferir marca, tensão, força de retenção (kgf) e se acompanha suportes.'),
  (54, 'Terminal de Vídeo IP Universal com Wi-Fi Intelbras TVIP 3000 WIFI', 'TVIP 3000 WIFI terminal de video IP', 'Intelbras', 'TVIP 3000 WIFI', 'Controle de Acesso', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Terminal de Vídeo IP Intelbras TVIP 3000 WiFi Tela 7 Touch', 'Terminal de Vídeo IP Intelbras TVIP 3000 WiFi Tela 7" - Novo', 'Terminal de vídeo IP universal Intelbras TVIP 3000 WIFI, monitor interno para videoporteiros IP com tela touch de 7 polegadas e conectividade Wi-Fi ou cabeada. Por usar o protocolo SIP, é compatível com diversos sistemas de interfonia IP do mercado, oferecendo modernidade e praticidade para residências e condomínios.

Principais recursos:
- Tela LCD colorida de 7 polegadas com touch capacitivo
- Conexão Wi-Fi 2.4 GHz (802.11 b/g/n) ou Ethernet 10/100
- Alimentação por PoE (802.3af) ou fonte 12 Vdc
- Protocolo SIP 2.0, compatível com sistemas de outros fabricantes
- Visualização de câmeras IP via RTSP (H.264)
- Microfone e alto-falante embutidos
- Até 8 zonas de alarme

Especificações técnicas:
- Tela: 7 polegadas, 800 x 480, touch capacitivo
- Protocolo: SIP 2.0 (RFC 3261)
- Codecs de áudio: PCMU, PCMA, G.729 e G.722
- Vídeo: resolução máxima 1280 x 720 via RTSP, H.264
- Wi-Fi: IEEE 802.11 b/g/n, 2.4 GHz, antena 2,1 dBi
- Rede: 1 porta Ethernet 10/100 com PoE 802.3af
- Memória: 64 MB RAM / 128 MB ROM
- Alimentação: PoE ou 12 Vdc (fonte não inclusa)

Conteúdo da embalagem:
- 1 terminal TVIP 3000 WIFI
- Suporte de fixação e manual

Aplicação:
Indicado como monitor interno de apartamentos e residências em sistemas de videoporteiro IP, integrando chamadas da portaria, abertura de portas e visualização de câmeras.

Condição: produto novo, na embalagem.

Observação: fonte de alimentação não inclusa. Dúvidas sobre compatibilidade? Envie sua pergunta.', '{"Marca":"Intelbras","Modelo":"TVIP 3000 WIFI","Tipo":"Terminal de vídeo IP (monitor interno)","Tela":"LCD 7\" colorida, 800 x 480, touch capacitivo","Protocolo":"SIP 2.0 (RFC 3261)","Codecs de áudio":"PCMU, PCMA, G.729, G.722","Vídeo":"RTSP, H.264, até 1280 x 720","Wi-Fi":"IEEE 802.11 b/g/n 2.4 GHz","Rede":"Ethernet 10/100 com PoE 802.3af","Memória":"64 MB RAM / 128 MB ROM","Zonas de alarme":"Até 8","Alimentação":"PoE ou 12 Vdc (fonte não inclusa)"}'::jsonb, array['tvip 3000 wifi', 'terminal video ip intelbras', 'monitor videoporteiro ip', 'videoporteiro sip', 'monitor interno intelbras wifi', 'tvip 3000', 'videoporteiro ip condominio']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Interfones e Porteiros > Videoporteiros', 'Eletrônicos e celulares > Outros itens', '1 terminal TVIP 3000 WIFI, suporte de fixação, manual', '1 ano de garantia do fabricante', null, 1, 8, 18, 26, 1099, 1011, 1449, array['https://backend.intelbras.com/sites/default/files/2024-01/Datasheet-TVIP%203000%20WIFI_4.pdf', 'https://www.intelbras.com/pt-br/terminal-de-video-ip-universal-com-wi-fi-tvip-3000-wifi', 'https://www.mercadolivre.com.br/terminal-interno-video-porteiro-ip-tvip-3000-wifi-intelbras-cor-cinza-12vdc/p/MLB27191336', 'https://www.netalarmes.com.br/terminal-de-video-ip-universal-com-wi-fi-tvip-3000-wifi']::text[], 'alta', 'Confirmar a cor (branco, preto/prata ou cinza) e itens inclusos na embalagem.'),
  (55, 'Controlador de Acesso Biométrico e RFID 125 kHz Intelbras SS 3420 BIO', 'controlador de acesso com leitor biométrico e RFID SS 3420 Bio', 'Intelbras', 'SS 3420 BIO', 'Controle de Acesso', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Controlador de Acesso Intelbras SS 3420 Bio Biometria RFID', 'Controlador de Acesso Biometria e RFID Intelbras SS 3420 BIO - Novo', 'Controlador de acesso Intelbras SS 3420 BIO, com autenticação por biometria digital e cartão de proximidade RFID 125 kHz. Robusto, com grau de proteção IP65 e IK10, é indicado inclusive para áreas externas, ideal para portarias, condomínios, empresas e residências.

Principais recursos:
- Autenticação por biometria digital e cartão/tag RFID 125 kHz
- Modo simples ou combinado (ex.: cartão + digital)
- Capacidade para 30.000 usuários, 3.000 biometrias e 150.000 eventos
- Grau de proteção IP65 e IK10 para ambientes externos
- Comunicação TCP/IP (Ethernet 10/100)
- Funciona em modo stand alone ou com o software InControl Web e Defense IA
- Compatível com leitores auxiliares Wiegand e RS-485 da linha Bio-T Intelbras
- Backup e restauração por USB
- Alarme de tamper, coação e sensor de porta aberta

Especificações técnicas:
- Alimentação: 12 Vdc
- Corrente de operação: 400 mA
- Frequência RFID: 125 kHz
- Portas: 1 RS-485, 1 Wiegand (entrada/saída), 1 USB, 1 Ethernet
- Entrada de alarme: 1 / Saída de alarme: 1 (relé)
- Entrada para botão de saída: 1
- Interface: sonora e visual (LED de status)
- Temperatura de operação: -10 a 50 graus C
- Dimensões: 55 x 160 x 35 mm

Conteúdo da embalagem:
- 1 controlador SS 3420 BIO
- Acessórios de fixação e guia de instalação

Aplicação:
Indicado para controle de entrada em portões, portas de empresas, academias, condomínios e áreas restritas, acionando fechaduras elétricas, eletroímãs ou fechos.

Condição: produto novo, na embalagem.

Dúvidas sobre instalação ou integração? Envie sua pergunta.', '{"Marca":"Intelbras","Modelo":"SS 3420 BIO","Tipo":"Controlador de acesso biométrico e RFID","Autenticação":"Biometria digital e RFID 125 kHz (simples ou combinado)","Capacidade de usuários":"30.000","Capacidade de biometrias":"3.000","Capacidade de cartões":"30.000","Capacidade de registros":"150.000","Comunicação":"Ethernet 10/100 (TCP/IP)","Portas":"1 RS-485, 1 Wiegand (E/S), 1 USB","Entrada de alarme":"1","Saída de alarme":"1 (relé)","Botão de saída":"1","Tamper / Coação":"Sim","Alimentação":"12 Vdc","Corrente de operação":"400 mA","Grau de proteção":"IP65 e IK10","Temperatura de operação":"-10 a 50 °C","Dimensões (L x A x P)":"55 x 160 x 35 mm","Software compatível":"InControl Web, Defense IA"}'::jsonb, array['ss 3420 bio', 'controlador de acesso intelbras', 'controle de acesso biometrico', 'leitor biometrico rfid', 'controle de acesso 125khz', 'biometria intelbras', 'controlador acesso ip65']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Controle de Acesso > Controladores de Acesso', 'Eletrônicos e celulares > Outros itens', '1 controlador SS 3420 BIO, acessórios de fixação, guia de instalação', '1 ano de garantia do fabricante', '7896637624114', 0.6, 7, 12, 22, 1499, 1490, 1999, array['https://backend.intelbras.com/sites/default/files/2023-12/Datasheet%20SS%203420_V6_0.pdf', 'https://www.intelbras.com/pt-br/controlador-de-acesso-rfid-125-khz-ss-3420-bio', 'https://lista.mercadolivre.com.br/intelbras-ss-3420-bio-125', 'https://www.upperseg.com.br/interfonia/controle-de-acesso/controladores/controlador-de-acesso-rfid-125khz-intelbras-ss-3420-bio/', 'https://www.igtechgrupo.com.br/controle-de-acesso/controle-de-acesso/controladoras/controlador-de-acesso-rfid-125khz-intelbras-ss-3420-bio']::text[], 'alta', 'Confirmar na etiqueta que é a versão SS 3420 BIO (125 kHz) e não SS 3420 MF BIO (13,56 MHz). EAN obtido de uma única loja; conferir na caixa.'),
  (56, 'Terminal Dedicado Porteiro Eletrônico Intelbras XPE 1001 Plus ID', 'Terminal dedicado porteiro eletrônico XPE 1001 plus ID', 'Intelbras', 'XPE 1001 Plus ID', 'Controle de Acesso', 'usado', 1, false, 'nenhum', 'somente_estoque', 'Usado, para estoque, não vender', 'Porteiro Eletrônico Intelbras XPE 1001 Plus ID RFID 1 Tecla', 'Terminal Porteiro Eletrônico Intelbras XPE 1001 Plus ID Usado', 'Terminal dedicado de porteiro eletrônico Intelbras XPE 1001 Plus ID, solução viva-voz de uma tecla com leitor de proximidade RFID integrado, ideal para controlar e liberar o acesso de portas e portões em residências, empresas e condomínios.
Principais recursos:
- Terminal viva-voz de 1 tecla, com chamada direta para um ramal previamente programado
- Leitor RFID Mifare 13,56 MHz integrado para abertura com chaveiro ou cartão
- Abertura de fechadura também por botoeira
- Saída para fechadura eletromecânica e saída de contato seco
- Pode funcionar de forma individual ou integrado ao sistema de controle de acesso SCA 1000 via barramento RS485
- Cadastro de tags pelo telefone ou pelo módulo MIP
- Entradas para sensores e botoeiras
Especificações técnicas:
- Saída de fechadura elétrica: 12 V / 1 A
- Contato seco: até 24 V / 1 A
- Leitor: RFID Mifare 13,56 MHz
- Entradas: 2 para sensor e 2 para botoeira
- Operação com MIP 1000 ou stand-alone
- Produto homologado pela Anatel
Aplicação: indicado para entradas sociais e de serviço, portarias de condomínios, comércios e escritórios que precisam de comunicação com a portaria ou ramal e liberação de acesso por tag.
Condição: produto usado, testado e funcionando.
Item reservado para uso em estoque técnico.', '{"Marca":"Intelbras","Modelo":"XPE 1001 Plus ID","Tipo":"Terminal dedicado viva-voz de 1 tecla","Leitor de proximidade":"RFID Mifare 13,56 MHz","Saída de fechadura":"12 V / 1 A","Contato seco":"até 24 V / 1 A","Entradas":"2 sensores e 2 botoeiras","Comunicação com SCA 1000":"RS485","Modo de operação":"Com MIP 1000 ou stand-alone","Homologação":"Anatel"}'::jsonb, array['porteiro eletrônico intelbras', 'XPE 1001 Plus ID', 'terminal dedicado intelbras', 'porteiro rfid', 'interfone condomínio', 'XPE 1001', 'porteiro com tag mifare']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Interfones e Porteiros Eletrônicos', 'Eletrônicos e celulares > Outros itens', '1 terminal XPE 1001 Plus ID (itens adicionais a conferir)', 'Sem garantia', null, 0.6, 8, 14, 20, null, null, null, array['https://www.intelbras.com/pt-br/terminal-dedicado-porteiro-eletronico-xpe-1001-plus-id', 'https://backend.intelbras.com/sites/default/files/2022-12/Manual_XPE_1001_1013_Plus_ID_03-22_site.pdf', 'https://www.dicomp.com.br/downloads/materiais_apoio/datasheet/17794-1.pdf']::text[], 'alta', 'Item marcado para estoque (não vender). Conferir acessórios presentes (tags, suporte) caso um dia seja anunciado.'),
  (57, 'Detector de Temperatura Endereçável Intelbras DTE 521', 'DTE 521', 'Intelbras', 'DTE 521', 'Alarme e Sensores', 'novo', 5, true, 'mercado_livre', 'a_revisar', null, 'Detector Temperatura Endereçável Intelbras DTE 521', 'Detector de Temperatura Endereçável Intelbras DTE 521 Novo', 'Detector de temperatura endereçável Intelbras DTE 521, desenvolvido para sistemas de detecção e alarme de incêndio. Seu sensor monitora com precisão as variações de temperatura do ambiente e dispara quando a temperatura ultrapassa o valor pré-determinado (temperatura fixa) ou quando ocorre uma elevação brusca (termovelocimétrico), identificando inclusive aquecimentos gerados por fontes de combustão limpa, que não produzem fumaça visível.
Principais recursos:
- Detecção térmica e termovelocimétrica
- Endereçável, com faixa de endereços de 1 a 250
- Instalação a 2 fios no laço, sem polaridade
- Classe de instalação A ou B
- LED indicador: piscando em supervisão e aceso em alarme
- Material ABS com proteção UV e design moderno
- Comunica-se com as centrais de alarme de incêndio endereçáveis da linha CIE Intelbras
Especificações técnicas:
- Tensão de operação: 20 a 30 Vdc
- Corrente em supervisão: menor que 0,4 mA
- Corrente em alarme: menor que 2 mA
- Sensibilidade: classe A2R (mínimo 54 °C ± 2 °C ou 20 °C/minuto)
- Temperatura de operação: -10 a 50 °C
- Umidade relativa: até 95% não condensada
- Uso interno
- Cor: branco
- Dimensões: 48 x 100 mm
- Peso: 103 g
Aplicação: indicado para cozinhas, garagens, casas de máquinas, depósitos e outros ambientes internos onde detectores de fumaça podem gerar alarmes falsos, em prédios comerciais, indústrias e condomínios.
Condição: produto novo.
Garantia do fabricante Intelbras. Ideal para instaladores e integradores de sistemas de incêndio.', '{"Marca":"Intelbras","Modelo":"DTE 521","Tipo":"Detector térmico / termovelocimétrico endereçável","Tensão de operação":"20 a 30 Vdc","Corrente em supervisão":"< 0,4 mA","Corrente em alarme":"< 2 mA","Sensibilidade":"Classe A2R (mín. 54 °C ± 2 °C ou 20 °C/min)","Instalação no laço":"2 fios, sem polaridade","Classe de instalação":"A ou B","Faixa de endereços":"1 a 250","Indicação visual":"LED (supervisão piscando / alarme aceso)","Temperatura de operação":"-10 a 50 °C","Umidade relativa":"< 95% não condensada","Grau de proteção":"Uso interno","Material":"ABS com proteção UV","Cor":"Branco","Dimensões":"48 x 100 mm","Peso":"103 g","Compatibilidade":"Centrais de incêndio endereçáveis linha CIE Intelbras"}'::jsonb, array['detector de temperatura intelbras', 'DTE 521', 'detector termovelocimétrico', 'detector endereçável', 'alarme de incêndio intelbras', 'sensor de temperatura incêndio', 'central CIE intelbras']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Alarmes e Sensores > Detectores de Fumaça e Temperatura', 'Eletrônicos e celulares > Outros itens', '1 detector DTE 521 com base; manual', '1 ano de garantia do fabricante', null, 0.18, 7, 12, 12, 129, 115, 160, array['https://www.intelbras.com/pt-br/detector-de-temperatura-enderecavel-dte-521', 'https://www.dicomp.com.br/downloads/materiais_apoio/datasheet/22003-1.pdf', 'https://www.magazineluiza.com.br/busca/detector+enderecavel']::text[], 'alta', 'Confirmar se a base acompanha o detector e o prazo de garantia na embalagem. 5 unidades.'),
  (58, 'Bateria Estacionária VRLA Moura 12MVA-7 12V 7Ah', 'Bateria estacionária nobreak Moura 12MVA-7', 'Moura', '12MVA-7', 'Energia', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Bateria Estacionária Moura 12MVA-7 12V 7Ah Nobreak Alarme', 'Bateria Estacionária Moura 12MVA-7 12V 7Ah Nova para Nobreak', 'Bateria estacionária Moura 12MVA-7, 12 V e 7 Ah, com tecnologia VRLA AGM (chumbo-ácido regulada por válvula), selada e livre de manutenção. É a reposição ideal para nobreaks, centrais de alarme, cercas elétricas, motores de portão com bateria, iluminação de emergência e sistemas de segurança.
Principais recursos:
- Tecnologia VRLA AGM selada, não necessita adição de água
- Livre de manutenção
- Fornecimento estável de energia para equipamentos eletrônicos sensíveis
- Padrão de tamanho 12 V 7 Ah, compatível com a maioria dos nobreaks e centrais do mercado
- Fabricação Moura, marca nacional reconhecida em baterias
Especificações técnicas:
- Tensão nominal: 12 V
- Capacidade: 7 Ah (C20 a 25 °C)
- Capacidade em C10: 6,5 Ah; em C5: 6,35 Ah; em C1: 4,53 Ah
- Resistência interna: aproximadamente 30 mΩ
- Vida útil de projeto: 5 anos (em flutuação, conforme fabricante)
- Dimensões aproximadas: 151 x 65 x 98 mm
- Peso aproximado: 2,1 kg
Aplicação: nobreaks de 600 a 1500 VA, centrais de alarme, cercas elétricas, controle de acesso, fechaduras eletroímã, sistemas de CFTV com backup, luminárias de emergência e equipamentos hospitalares.
Condição: produto novo.
Confira a polaridade e o tipo de terminal do seu equipamento antes da instalação.', '{"Marca":"Moura","Modelo":"12MVA-7","Tecnologia":"VRLA AGM (chumbo-ácido selada)","Tensão nominal":"12 V","Capacidade (C20)":"7 Ah","Capacidade (C10)":"6,5 Ah","Capacidade (C5)":"6,35 Ah","Capacidade (C1)":"4,53 Ah","Resistência interna":"30 mΩ","Vida útil de projeto":"5 anos","Dimensões":"151 x 65 x 98 mm","Peso":"2,1 kg","Manutenção":"Livre de manutenção"}'::jsonb, array['bateria 12v 7ah', 'bateria moura 12v 7ah', '12MVA-7', 'bateria nobreak', 'bateria estacionária', 'bateria alarme', 'bateria cerca elétrica', 'bateria vrla agm']::text[], 'Informática > Estabilizadores e No Breaks > Baterias para No Breaks', 'Eletrônicos e celulares > Computadores e acessórios', '1 bateria Moura 12MVA-7 12V 7Ah', 'Garantia do fabricante Moura (conferir prazo na etiqueta/nota)', null, 2.2, 11, 7, 16, 135, 125, 150, array['https://download.aldo.com.br/pdfprodutos/Produto36334IdArquivo15589.pdf', 'https://www.kabum.com.br/produto/949034', 'https://www.buscape.com.br/bateria-de-carro/bateria-para-nobreak-12v-7ah-estacionaria-tecnologia-vrla-agm-moura', 'https://www.pontofrio.com.br/bateria-estacionaria-moura-recarregavel-com-saida-de-12v-7ah-mga-ideal-para-nobreaks-e-portoes-eletricos/p/1557889671']::text[], 'alta', 'Conferir data de fabricação (bateria parada perde carga) e se é 12MVA-7 ou 12MVA-7E; conferir tipo de terminal (F1/F2).'),
  (59, 'Cuidador Eletrônico Wireless Flash (Campainha de Chamada sem Fio para Idosos)', 'Cuidador Eletrônico Wireless Modelo Flash', null, 'Flash', 'Alarme e Sensores', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Cuidador Eletrônico Wireless Flash Campainha Sem Fio Idoso', 'Cuidador Eletrônico Wireless Flash Campainha Sem Fio para Idoso Novo', 'Cuidador eletrônico wireless modelo Flash, sistema de chamada sem fio que permite que um idoso, pessoa acamada, paciente ou criança chame o cuidador ou familiar de outro cômodo da casa com apenas um toque no botão.
Principais recursos:
- Comunicação sem fio entre o botão de chamada e o receptor
- Instalação simples, sem necessidade de passar fios
- Aviso ao cuidador no receptor quando o botão é acionado
- Ideal para quem precisa de atenção e não consegue se locomover com facilidade
- Botão compacto que pode ficar próximo da cama, poltrona ou banheiro
Aplicação: indicado para residências com idosos, pessoas com mobilidade reduzida, pós-operatório, gestantes, crianças, clínicas e casas de repouso. Também pode ser usado como campainha sem fio.
Condição: produto novo.
Consulte as fotos do anúncio para verificar os itens e o modelo exato. Dúvidas sobre o funcionamento podem ser enviadas pelo chat antes da compra.
Uma solução prática que traz mais segurança e tranquilidade para quem é cuidado e para quem cuida.', '{"Modelo":"Flash","Tipo":"Sistema de chamada sem fio (cuidador eletrônico)","Conexão":"Sem fio (wireless)"}'::jsonb, array['cuidador eletrônico', 'campainha para idoso', 'campainha sem fio idoso', 'botão de chamada idoso', 'alarme para idoso', 'chamador de enfermagem', 'cuidador eletrônico wireless']::text[], 'Saúde > Cuidado da Saúde > Equipamentos Médicos > Outros', 'Eletrônicos e celulares > Outros itens', 'Conferir: receptor, botão/transmissor de chamada e manual', 'Conferir garantia informada na embalagem', null, 0.3, 6, 12, 16, null, null, null, array['https://lista.mercadolivre.com.br/cuidador-eletronico-idoso', 'https://lista.mercadolivre.com.br/campainha-de-quarto-de-idoso-sem-fio']::text[], 'baixa', 'Produto não localizado na internet. Informar marca/fabricante, foto da embalagem e o que acompanha (receptor, botões, alcance, alimentação) para completar ficha e preço. Interpretado como campainha/chamador sem fio para idosos, não babá eletrônica.'),
  (60, 'Central de Comando para Cancela PPA (1.8)', 'Central de cancelas 1.8 PPA', 'PPA', 'Central de cancela 1.8 (modelo a confirmar)', 'Automação de Portões', 'novo', 2, false, 'nenhum', 'somente_estoque', 'Para estoque, nova', 'Central de Comando Cancela PPA Placa Eletrônica 1.8', 'Central de Comando para Cancela PPA Placa Eletrônica Nova', 'Central de comando (placa eletrônica) PPA para cancela automática, responsável por controlar a abertura e o fechamento da barreira em estacionamentos, condomínios e empresas.
Principais recursos:
- Placa de comando original PPA para cancelas automáticas
- Controle de abertura e fechamento da barreira
- Indicada para reposição ou manutenção de cancelas PPA
- Componente original do fabricante, garantindo o funcionamento conforme projeto da cancela
- Permite integração com acessórios de controle de acesso, como botoeiras, receptores e sensores, conforme o modelo da cancela
A PPA (Motoppar) é uma das maiores fabricantes nacionais de automatizadores de portões e cancelas, com ampla rede de assistência técnica e peças de reposição no Brasil.
Aplicação: reposição em cancelas automáticas PPA usadas em estacionamentos, condomínios, shoppings, indústrias e controle de acesso veicular. Indicada para instaladores e empresas de manutenção que precisam de peça a pronta entrega.
Condição: produto novo.
Confira a compatibilidade com o modelo da sua cancela antes da compra. Recomendamos a instalação por técnico especializado em automação.', '{"Marca":"PPA","Tipo":"Central / placa de comando para cancela automática","Identificação informada":"1.8"}'::jsonb, array['central cancela ppa', 'placa cancela ppa', 'central de comando ppa', 'placa barrier ppa', 'cancela automática ppa', 'placa eletrônica cancela']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Automatizadores de Portões > Centrais e Placas', 'Para a sua casa > Materiais de construção e jardim', '1 central de comando PPA', 'Garantia do fabricante PPA (conferir)', null, 0.5, 6, 15, 20, null, null, null, array['https://www.aecweb.com.br/produto/barrier/24147', 'https://files.irroba.com.br/acreaaoi/download/f85e14c573c65b0938d4f3aa48a8df2d.ppa-datasheet-cancela-barrier-ppa_1738179003371.pdf']::text[], 'baixa', 'Não foi encontrada central PPA chamada ''1.8''. Conferir o nome/código impresso na placa (pode ser versão de firmware 1.8 ou referência a cancela de 1,8 m). Item para estoque, não vender.'),
  (61, 'Placa de Rede PCI Wireless N 150 Mbps Intelbras WPN 200', 'intelbras WPN 200', 'Intelbras', 'WPN 200', 'Redes', 'novo', 2, true, 'mercado_livre', 'a_revisar', null, 'Placa de Rede PCI Wireless Intelbras WPN 200 150 Mbps', 'Placa de Rede PCI Wireless N 150 Mbps Intelbras WPN 200 Nova', 'Placa de rede PCI Wireless N 150 Mbps Intelbras WPN 200, a forma prática de conectar seu computador desktop à rede Wi-Fi sem cabos. Compatível com os padrões IEEE 802.11b/g/n, oferece taxas de até 150 Mbps no padrão N, ideal para navegação, vídeos e jogos.
Principais recursos:
- Taxa de até 150 Mbps (IEEE 802.11n)
- Compatível com 802.11b/g/n
- QoS (WMM) para melhor desempenho em voz e vídeo
- Botão/função WPS para configuração simplificada da segurança
- Suporte ao modo AP (ponto de acesso)
- Antena omnidirecional removível
- Criptografia WEP, WPA/WPA2, TKIP/AES
Especificações técnicas:
- Interface: PCI 32 bits
- Chipset: Atheros AR9227
- Antena: omnidirecional 2 dBi, destacável
- Temperatura de operação: 0 a 40 °C
- Dimensões: 133 x 121 x 22 mm
- Sistemas compatíveis: Windows XP, Vista, 7 e 8 (drivers disponíveis no site do fabricante)
Aplicação: computadores desktop com slot PCI que precisam de conexão sem fio, em casa ou no escritório.
Condição: produto novo (modelo descontinuado pelo fabricante).
Verifique se sua placa-mãe possui slot PCI convencional antes da compra.', '{"Marca":"Intelbras","Modelo":"WPN 200","Interface":"PCI 32 bits","Padrões":"IEEE 802.11b/g/n","Taxa máxima":"150 Mbps","Chipset":"Atheros AR9227","Antena":"Omnidirecional 2 dBi removível","Segurança":"WEP, WPA/WPA2, TKIP/AES","Recursos":"QoS (WMM), WPS, modo AP","Temperatura de operação":"0 a 40 °C","Dimensões":"133 x 121 x 22 mm","Sistemas operacionais":"Windows XP, Vista, 7 e 8"}'::jsonb, array['placa wireless pci', 'placa de rede wifi pc', 'intelbras wpn 200', 'WPN 200', 'placa wifi 150 mbps', 'adaptador wireless desktop', 'placa pci wifi intelbras']::text[], 'Informática > Conectividade e Redes > Placas de Rede', 'Eletrônicos e celulares > Computadores e acessórios', '1 placa PCI WPN 200, 1 antena, CD/guia de instalação (conferir)', 'Garantia do fabricante (conferir; produto descontinuado)', null, 0.3, 5, 15, 20, 69, 50, 99, array['https://www.intelbras.com/pt-br/placa-pci-wireless-n-150-mbps-wpn-200', 'https://backend.intelbras.com/sites/default/files/integration/datasheet_wpn200_1_12_aprovacao.pdf', 'https://backend.intelbras.com/sites/default/files/integration/manual_-_placa_pci_wireless_n_150_mbps_wpn_200.pdf']::text[], 'alta', 'Preço estimado (produto descontinuado, poucos anúncios). Conferir se é PCI ou PCI Express e se acompanha antena e perfil baixo.'),
  (62, 'Sensor de Estacionamento KNUP com Display LCD e 4 Sensores', 'Sensor de estacionamento com tela LCD KNUP', 'KNUP', null, 'Automotivo', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Sensor de Estacionamento Knup Display LCD 4 Sensores', 'Sensor de Estacionamento Ré Knup com Tela LCD 4 Sensores Novo', 'Sensor de estacionamento KNUP com tela LCD, o acessório que facilita as manobras de ré e ajuda a evitar batidas e arranhões no para-choque. O sistema detecta obstáculos atrás do veículo e informa a distância no display, acompanhado de alerta sonoro que fica mais intenso conforme o carro se aproxima do obstáculo.
Principais recursos:
- Display LCD que mostra a distância até o obstáculo
- Alerta sonoro progressivo
- Sensores instalados no para-choque traseiro
- Acionamento automático ao engatar a ré
- Instalação universal na maioria dos carros, utilitários e caminhonetes 12 V
Aplicação: veículos de passeio, SUVs, picapes e utilitários, ideal para estacionar em garagens apertadas, ruas movimentadas e vagas pequenas.
Condição: produto novo.
Recomendamos a instalação por profissional de som e acessórios automotivos. Confira nas fotos os itens que acompanham o kit.
Mais segurança e praticidade no dia a dia para você e sua família.', '{"Marca":"KNUP","Tipo":"Sensor de estacionamento de ré","Display":"LCD","Alimentação":"12 V (veicular)"}'::jsonb, array['sensor de estacionamento', 'sensor de ré', 'sensor de ré com display', 'knup sensor estacionamento', 'sensor estacionamento lcd', 'kit sensor de ré 4 sensores', 'radar de ré']::text[], 'Acessórios para Veículos > Acessórios de Carros e Caminhonetes > Segurança Veicular > Sensores de Estacionamento', 'Autos e peças > Peças e acessórios > Carros, vans e utilitários', 'Display LCD, sensores, central, chicote e broca (conferir)', 'Garantia do fabricante (conferir na embalagem)', null, 0.6, 7, 15, 22, 79, 60, 120, array['https://m.magazineluiza.com.br/busca/sensor+veicular+knup/', 'https://www.olx.com.br/anuncios/display-sensor-de-estacionamento', 'https://br.my-best.com/categories/907']::text[], 'baixa', 'Modelo exato não identificado (KNUP KP-S100 é de 4 sensores, mas sem confirmação de LCD). Informar código do modelo na caixa, quantidade de sensores e cor para ajustar ficha e preço.'),
  (63, 'Câmera IP Panorâmica Axis M3007-P 5MP Mini Dome 360°', 'AXIS M30 Network Camera Series AXIS M3007-P', 'Axis Communications', 'M3007-P', 'CFTV', 'novo', 1, true, 'mercado_livre', 'a_revisar', null, 'Câmera IP Axis M3007-P 5MP Panorâmica 360 Mini Dome PoE', 'Câmera IP Axis M3007-P 5MP Panorâmica 360 Graus PoE Nova', 'Câmera de rede AXIS M3007-P, mini dome fixa para ambientes internos com resolução de 5 megapixels e visão panorâmica de 360°. Ultra discreta e com foco ajustado de fábrica, permite que uma única câmera cubra todo um ambiente, como lojas, escritórios, recepções e salas, substituindo várias câmeras convencionais.
Principais recursos:
- Resolução de 5 MP com visão geral de 360° ou 180°
- Visualizações corrigidas (dewarped): panorâmica, panorâmica dupla e quad view
- Até quatro áreas recortadas individualmente com PTZ digital
- Design ultra discreto, montagem em teto ou parede
- Alimentação PoE (IEEE 802.3af), um único cabo para dados e energia
- Armazenamento local em cartão microSDHC (edge storage)
- Detecção de movimento por vídeo e alarme de violação ativo
- Compatível com ONVIF Profile S e Profile G e com a plataforma de aplicativos ACAP
Especificações técnicas:
- Sensor: RGB CMOS 1/3,2 pol. varredura progressiva
- Lente: fixa 1,3 mm F2.8 (M12)
- Campo de visão: 187° horizontal, 168° vertical
- Sensibilidade: 0,6 lux
- Resolução: até 2592 x 1944
- Taxa de quadros: até 12 fps na visão geral 360° e panorâmica
- Temperatura de operação: 0 a 45 °C
Aplicação: monitoramento interno de lojas, corredores, escritórios, recepções, salas de aula e ambientes amplos.
Condição: produto novo.
Câmera profissional de padrão corporativo da marca sueca Axis, referência mundial em vídeo IP.', '{"Marca":"Axis Communications","Modelo":"AXIS M3007-P","Tipo":"Câmera IP mini dome fixa panorâmica interna","Resolução":"5 MP (2592 x 1944)","Sensor":"RGB CMOS 1/3,2\" varredura progressiva","Lente":"1,3 mm F2.8, M12, fixa","Campo de visão":"187° H / 168° V","Sensibilidade":"0,6 lux","Taxa de quadros":"até 12 fps (visão 360° / panorâmica)","Visualizações":"360°, panorâmica, panorâmica dupla, quad, 4 áreas recortadas","Alimentação":"PoE IEEE 802.3af","Armazenamento local":"microSDHC","Padrões":"ONVIF Profile S e G","Temperatura de operação":"0 a 45 °C","Instalação":"Teto ou parede (uso interno)"}'::jsonb, array['câmera axis', 'axis m3007-p', 'câmera ip panorâmica', 'câmera 360 graus', 'câmera fisheye 5mp', 'câmera ip poe', 'mini dome axis', 'câmera olho de peixe']::text[], 'Segurança > Câmeras de Segurança > Câmeras IP', 'Eletrônicos e celulares > Câmeras e acessórios', '1 câmera AXIS M3007-P, guia de instalação, kit de fixação (conferir)', 'Garantia do fabricante (conferir; modelo descontinuado/fim de linha)', null, 0.5, 8, 15, 15, 1990, 1500, 3500, array['https://secure.axis.com/files/datasheet/ds_m3007p_1485634_en_1705.pdf', 'https://www.axis.com/files/datasheet/ds_m3007p_1636961_es_1705.pdf', 'https://netcamcenter.com/en/products/ip-cameras/m3007-p', 'https://www.mfrural.com.br/busca/axis-cor']::text[], 'alta', 'Preço com baixa referência no Brasil (modelo fim de linha; M3007-PV visto a R$ 6.080 em classificado). Avaliar preço conforme procura.'),
  (64, 'Motor de Portão Deslizante PPA DZ Rio 500 Jetflex', 'Motor DZ RIO 500 JETFLEX', 'PPA', 'DZ Rio 500 Jetflex', 'Automação de Portões', 'usado', 2, true, 'olx', 'a_revisar', null, 'Motor Portão Deslizante PPA DZ Rio 500 Jetflex 500kg', 'Motor Portão Deslizante PPA DZ Rio 500 Jetflex 500kg Usado', 'Motor para portão deslizante PPA DZ Rio 500 Jetflex, automatizador residencial robusto e rápido, fabricado pela PPA (Motoppar), uma das principais marcas de automação de portões do Brasil. Indicado para portões de correr de até 500 kg.
Principais recursos:
- Automatizador para portão deslizante (de correr)
- Capacidade para portões de até 500 kg
- Tecnologia Jetflex da PPA, com central inversora que permite maior velocidade e partida e parada suaves
- Alimentação 127 V / 220 V
- Estrutura robusta para uso residencial
Especificações técnicas:
- Marca: PPA
- Linha: DZ Rio Jetflex
- Tipo: deslizante
- Peso máximo do portão: 500 kg
- Tensão: 127 V / 220 V
Aplicação: portões deslizantes residenciais e de pequenos comércios.
Condição: produto usado, testado e funcionando. Vendido sem garantia.
Consulte nas fotos os itens que acompanham (central, cremalheira, controles). Recomendamos instalação por técnico especializado em automação de portões.', '{"Marca":"PPA","Modelo":"DZ Rio 500 Jetflex","Tipo":"Motor para portão deslizante","Peso máximo do portão":"500 kg","Tensão":"127 V / 220 V","Tecnologia":"Jetflex (central inversora)","Fabricante":"Motoppar Indústria e Comércio de Automatizadores Ltda"}'::jsonb, array['motor ppa', 'motor portão deslizante', 'dz rio 500 jetflex', 'motor ppa jetflex', 'motor portão 500kg', 'automatizador portão', 'motor ppa usado']::text[], 'Casa, Móveis e Decoração > Segurança para Casa > Automatizadores de Portões > Motores', 'Para a sua casa > Materiais de construção e jardim', '1 motor DZ Rio 500 Jetflex (conferir se inclui central, controles e cremalheira)', 'Sem garantia', null, 10, 30, 25, 40, 450, 350, 600, array['https://files.irroba.com.br/acreaaoi/download/036804ec935ac15e13792c19022caaff.p08665_tecnico_dzrio_rev1_1679082555812.pdf', 'https://m.magazineluiza.com.br/busca/motor+ppa+jet+flex/', 'https://www.olx.com.br/materiais-de-construcao/estado-df/distrito-federal-e-regiao/brasilia/all']::text[], 'alta', 'Conferir se acompanha central Jetflex, controles e cremalheira (muda bastante o preço). 2 unidades usadas; kit novo sai entre R$ 716 e R$ 888.'),
  (65, 'Nobreak Intelbras Attiv 700VA 350W Bivolt 4 Tomadas', 'Nobreak intelbras ATTIV 700 VA', 'Intelbras', 'Attiv 700VA', 'Energia', 'novo', 5, true, 'mercado_livre', 'a_revisar', null, 'Nobreak Intelbras Attiv 700va 350w Bivolt 4 Tomadas', 'Nobreak Intelbras Attiv 700VA 350W Bivolt 4 Tomadas Novo', 'Nobreak Intelbras Attiv 700 VA, proteção confiável para computadores, roteadores, modems, DVRs, câmeras e outros equipamentos eletrônicos. Mantém seus aparelhos funcionando durante quedas de energia e os protege contra variações da rede elétrica.
Principais recursos:
- Potência de 700 VA / 350 W
- Topologia interativa com regulação de tensão
- Entrada bivolt automática
- 4 tomadas no padrão brasileiro NBR 14136
- 9 níveis de proteção para seus equipamentos
- Religamento automático após o retorno da energia
- Bateria interna 12 V 7 Ah selada
- Controle por microprocessador
Especificações técnicas:
- Potência: 700 VA / 350 W
- Topologia: interativo
- Tensão de entrada: bivolt automático (96 a 149 V / 176 a 264 V)
- Tensão de saída: 120 V (conferir versão)
- Tomadas: 4 (NBR 14136)
- Bateria: 1 x 12 V 7 Ah
Aplicação: computadores de mesa, roteadores e modems, sistemas de CFTV (DVR/NVR e câmeras), centrais telefônicas, impressoras jato de tinta, consoles e equipamentos de automação.
Condição: produto novo, na embalagem.
Garantia do fabricante Intelbras. Mais segurança para seus equipamentos e continuidade no seu trabalho.', '{"Marca":"Intelbras","Modelo":"Attiv 700VA","Potência":"700 VA / 350 W","Topologia":"Interativo","Tensão de entrada":"Bivolt automático (96-149 V / 176-264 V)","Tensão de saída":"120 V (há versão 220 V - conferir)","Tomadas":"4 (NBR 14136)","Bateria":"1 x 12 V 7 Ah","Proteções":"9 níveis de proteção","Religamento automático":"Sim","Cor":"Preto"}'::jsonb, array['nobreak intelbras', 'nobreak 700va', 'attiv 700va', 'nobreak bivolt', 'nobreak para computador', 'nobreak 350w', 'nobreak intelbras attiv', 'nobreak dvr']::text[], 'Informática > Estabilizadores e No Breaks > No Breaks', 'Eletrônicos e celulares > Computadores e acessórios', '1 nobreak Attiv 700VA com bateria interna, cabo de força, manual', '2 anos de garantia do fabricante', null, 5, 22, 15, 32, 489, 470, 565, array['https://loja.intelbras.com.br/nobreak-attiv-700va-120v/p', 'https://loja.intelbras.com.br/nobreak-attiv-700va-220v/p', 'https://www.kabum.com.br/produto/309107/nobreak-intelbras-attiv-700va-350w-220v-4-tomadas-preto-4822204', 'https://www.pichau.com.br/nobreak-intelbras-attiv-700va-350w-bivolt-saida-120v-preto-attiv-700va-bivolt-nobreak', 'https://backend.intelbras.com/sites/default/files/2026-01/Manual_ATTIV_600VA_700VA_01-26_site.pdf']::text[], 'alta', 'Conferir na etiqueta a tensão de saída (120 V ou 220 V) e ajustar título/ficha; conferir prazo de garantia na caixa. 5 unidades.');

select setval(pg_get_serial_sequence('public.produtos', 'codigo'), (select max(codigo) from public.produtos));

insert into public.movimentacoes (produto_id, tipo, quantidade, saldo_apos, motivo, usuario)
select id, 'entrada', quantidade, quantidade, 'Estoque inicial (ESTOQUE ATUAL.txt)', 'importação'
from public.produtos where quantidade > 0;
