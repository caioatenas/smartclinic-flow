# Passo 5
- [x] Login, recuperação de senha e saída.
- [x] Perfis da equipe e permissões verificadas na nuvem.
- [x] Gestão segura de usuários e primeiro administrador reservado para cesar@master.com.
- [x] Preservar TV e totem públicos sem CPF, telefone ou prontuários.
- [x] Testar acessos reais de quatro perfis, cadastro administrativo, confirmação de conta e sincronização pública.

Limites da verificação: envio/recebimento real dos e-mails de recuperação e o redirecionamento externo de Google/Lovable não foram exercitados.

# Encaminhamentos entre salas
- [x] Criar encaminhamentos seguros com fila por sala e retorno ao médico.
- [x] Conectar painel médico, salas cadastradas e chamadas na TV.
- [x] Verificar permissões, fluxo real e apresentação em telas pequenas.

Fluxo inicial: utiliza salas cadastradas e sempre retorna ao médico; tipos de sala e fluxos especializados não foram definidos.

# Leitos, medicação e triagem
- [x] Gestão de leitos com ocupação, disponibilidade e histórico de movimentação.
- [x] Registro de medicação administrada com horários e conclusão.
- [x] Triagem com sinais vitais, alertas registrados pela enfermagem e retorno ao médico.
- [x] Verificar os três fluxos e atualização entre telas: entrada, transferência, liberação automática, registros e retorno ao médico exercitados; 14 testes passaram.
- [ ] Concluir verificação isolada de permissões e captura do histórico médico: créditos esgotados; sessão de teste recebeu autenticação automática também no contexto considerado público, e captura do histórico não confirmou a evidência esperada.