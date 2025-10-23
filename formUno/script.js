(function ($) {
    // --- FUNÇÕES AUXILIARES ---
    const EMAIL_DESTINO = "liberacao@lina.com.br";
    function mostrarEtapa(id) {
        $('.etapa').removeClass('ativa');
        $('#' + id).addClass('ativa');
        $('#form-overlay-container').scrollTop(0);
    }

    function validarEtapa(etapa) {
        let ehValido = true;
        etapa.find('input:visible[required], select:visible[required], textarea:visible[required]').each(function () {
            const field = $(this);
            field.removeClass('campo-invalido');
            if (!field.val().trim() || (field.is(':checkbox') && !field.is(':checked'))) {
                ehValido = false;
                field.addClass('campo-invalido');
            }
        });
        return ehValido;
    }

    function buscarCep(cepValue, suffix) {
        const cepLimpo = cepValue.replace(/\D/g, '');
        if (cepLimpo.length === 8) {
            fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`).then(res => res.json()).then(dados => {
                if (!dados.erro) {
                    $('#endereco' + suffix).val(dados.logradouro);
                    $('#bairro' + suffix).val(dados.bairro);
                    $('#cidade' + suffix).val(dados.localidade);
                    $('#estado' + suffix).val(dados.uf);
                    $('#numero' + suffix).focus();
                } else {
                    alert("CEP não encontrado.");
                }
            }).catch(error => console.error('Erro ao buscar CEP:', error));
        }
    }

    // --- GERAÇÃO DO CORPO DE TEXTO PARA E-MAIL ---
    function gerarCorpoTexto() {
        let corpoTexto = `NOVA FICHA CADASTRAL\n===================================\n\n`;
        const tipoCliente = $('#tipo_cliente').val();

        if (tipoCliente === 'fisica') {
            corpoTexto += `TIPO DE CADASTRO: Pessoa Física\n\n`;
            corpoTexto += `--- DADOS PESSOAIS ---\n`;
            corpoTexto += `Nome Completo: ${$('#nome_f').val()}\n`;
            corpoTexto += `CPF: ${$('#cpf_f').val()}\n`;
            corpoTexto += `RG: ${$('#rg_f').val()}\n`;
            corpoTexto += `Data de Nascimento: ${$('#nascimento_f').val()}\n\n`;

            corpoTexto += `--- ENDEREÇO RESIDENCIAL ---\n`;
            corpoTexto += `CEP: ${$('#cep_f').val()}\n`;
            corpoTexto += `Endereço: ${$('#endereco_f').val()}, Nº ${$('#numero_f').val()}\n`;
            corpoTexto += `Complemento: ${$('#complemento_f').val() || 'N/A'}\n`;
            corpoTexto += `Bairro: ${$('#bairro_f').val()}\n`;
            corpoTexto += `Cidade/UF: ${$('#cidade_f').val()}/${$('#estado_f').val()}\n\n`;

            corpoTexto += `--- CONTATOS PESSOAIS ---\n`;
            corpoTexto += `Telefone/Celular: ${$('#telefone_f').val()}\n`;
            corpoTexto += `E-mail Principal: ${$('#email_principal_f').val()}\n`;
            corpoTexto += `E-mail (Boleto): ${$('#email_boleto_f').val()}\n`;
            corpoTexto += `E-mail (NFE): ${$('#email_nfe_f').val()}\n\n`;

            corpoTexto += `--- ATIVIDADE PROFISSIONAL ---\n`;
            corpoTexto += `Profissão/Atividade: ${$('input[name="profissao_f"]').val() || 'N/A'}\n`;
            corpoTexto += `Empresa Atual: ${$('input[name="empresa_f"]').val() || 'N/A'}\n`;
            corpoTexto += `Telefone Comercial: ${$('input[name="telefone_comercial_f"]').val() || 'N/A'}\n`;
            corpoTexto += `Endereço Comercial: ${$('input[name="endereco_comercial_f"]').val() || 'N/A'}\n\n`;

            const liberacaoTiposF = $('input[name="liberacao_tipo_f[]"]:checked').map(function () { return this.value; }).get().join(', ');
            corpoTexto += `--- LIBERAÇÃO E AUTORIZADOS ---\n`;
            corpoTexto += `Forma(s) de Liberação: ${liberacaoTiposF || 'Nenhuma selecionada'}\n`;
            corpoTexto += `Pessoas Autorizadas para Retirada:\n`;
            $('#autorizados_container_f .dynamic-item').each(function (index) {
                corpoTexto += `  Autorizado ${index + 1}: Nome: ${$(this).find('input[name="auth_nome_f[]"]').val()}, CPF: ${$(this).find('input[name="auth_cpf_f[]"]').val()}\n`;
            });
            corpoTexto += `\n`;

            const obraTiposF = $('input[name="obra_tipo_f[]"]:checked').map(function () { return this.value; }).get().join(', ');
            corpoTexto += `--- OBRA / SERVIÇO ---\n`;
            corpoTexto += `Tipo: ${obraTiposF || 'N/A'}\n`;
            corpoTexto += `Nome da Obra: ${$('input[name="obra_nome_f"]').val() || 'N/A'}\n`;
            corpoTexto += `Endereço da Obra: ${$('input[name="obra_endereco_f"]').val() || 'N/A'}\n\n`;

            corpoTexto += `--- REFERÊNCIAS COMERCIAIS ---\n`;
            $('#referencias_container_f .dynamic-item').each(function (index) {
                corpoTexto += `  Referência ${index + 1}: Tipo: ${$(this).find('select[name="ref_tipo_f[]"]').val()}, Empresa/Banco: ${$(this).find('input[name="ref_empresa_f[]"]').val()}, Telefone: ${$(this).find('input[name="ref_telefone_f[]"]').val()}\n`;
            });
            corpoTexto += `\n`;

            const conheceuF = $('input[name="conheceu_f"]:checked').val();
            corpoTexto += `--- COMO CONHECEU A LOJA ---\n`;
            corpoTexto += `Forma: ${conheceuF || 'N/A'}\n`;
            if (conheceuF === 'Mídias Sociais') corpoTexto += `  Qual: ${$('input[name="conheceu_midia_social_qual_f"]').val()}\n`;
            if (conheceuF === 'Indicação') corpoTexto += `  Quem Indicou: ${$('input[name="conheceu_indicacao_qual_f"]').val()}\n`;

        } else if (tipoCliente === 'juridica') {
            const isCondominio = $('#is_condominio').is(':checked');
            corpoTexto += `TIPO DE CADASTRO: Pessoa Jurídica ${isCondominio ? '(CONDOMÍNIO)' : ''}\n\n`;
            corpoTexto += `--- DADOS DA EMPRESA ---\n`;
            corpoTexto += `Razão Social: ${$('#razao_social').val()}\nNome Fantasia: ${$('#nome_fantasia').val()}\nCNPJ: ${$('#cnpj').val()}\nIE: ${$('#ie_j').val() || 'N/A'}\nRamo: ${$('#ramo_atividade').val()}\n\n`;
            corpoTexto += `--- ENDEREÇO ---\n`;
            corpoTexto += `CEP: ${$('#cep_j').val()}\nEndereço: ${$('#endereco_j').val()}, Nº ${$('#numero_j').val()}\nCompl: ${$('#complemento_j').val() || 'N/A'}\nBairro: ${$('#bairro_j').val()}\nCidade/UF: ${$('#cidade_j').val()}/${$('#estado_j').val()}\n\n`;
            corpoTexto += `--- CONTATOS DA EMPRESA ---\n`;
            corpoTexto += `Telefone: ${$('#telefone_j').val()}\nE-mail Principal: ${$('#email_principal_j').val()}\nE-mail (Boleto): ${$('#email_boleto_j').val()}\nE-mail (NFE): ${$('#email_nfe_j').val()}\n\n`;
            if (isCondominio) {
                corpoTexto += `--- CONTATOS DO CONDOMÍNIO ---\n`;
                corpoTexto += `COBRANÇA: Tel: ${$('[name=condominio_cobranca_tel]').val() || 'N/A'}, Cel: ${$('[name=condominio_cobranca_cel]').val() || 'N/A'}, E-mail: ${$('[name=condominio_cobranca_email]').val() || 'N/A'}\n`;
                corpoTexto += `ADM: Tel: ${$('[name=condominio_adm_tel]').val() || 'N/A'}, Cel: ${$('[name=condominio_adm_cel]').val() || 'N/A'}, E-mail: ${$('[name=condominio_adm_email]').val() || 'N/A'}\n`;
                corpoTexto += `SÍNDICO: Tel: ${$('[name=condominio_sindico_tel]').val() || 'N/A'}, Cel: ${$('[name=condominio_sindico_cel]').val() || 'N/A'}, E-mail: ${$('[name=condominio_sindico_email]').val() || 'N/A'}\n\n`;
            }
            corpoTexto += `--- DADOS DO(S) SÓCIO(S) ---\n`;
            $('#socios_container .dynamic-item').each(function (i) {
                corpoTexto += `Sócio ${i + 1}: Nome: ${$(this).find('[name="socio_nome[]"]').val()}, CPF: ${$(this).find('[name="socio_cpf[]"]').val()}, RG: ${$(this).find('[name="socio_rg[]"]').val()}, Nasc: ${$(this).find('[name="socio_nascimento[]"]').val()}\n`;
            });
            corpoTexto += `\n`;
            const obraTiposJ = $('[name="obra_tipo_j[]"]:checked').map(function () { return this.value; }).get().join(', ');
            corpoTexto += `--- OBRA / SERVIÇO ---\nTipo: ${obraTiposJ || 'N/A'}\nNome: ${$('[name=obra_nome_j]').val() || 'N/A'}\nEndereço: ${$('[name=obra_endereco_j]').val() || 'N/A'}\n\n`;
            corpoTexto += `--- REFERÊNCIAS COMERCIAIS ---\n`;
            $('#referencias_container_j .dynamic-item').each(function (i) {
                corpoTexto += `Ref ${i + 1}: Tipo: ${$(this).find('[name="ref_tipo_j[]"]').val()}, Empresa: ${$(this).find('[name="ref_empresa_j[]"]').val()}, Tel: ${$(this).find('[name="ref_telefone_j[]"]').val()}\n`;
            });
            corpoTexto += `\n--- OUTROS CONTATOS ---\n`;
            corpoTexto += `Comprador: ${$('[name=contato_comprador]').val() || 'N/A'}\nFinanceiro: ${$('[name=contato_financeiro]').val() || 'N/A'}\nOutros: ${$('[name=contato_outros]').val() || 'N/A'}\n\n`;
            const liberacaoTiposJ = $('[name="liberacao_tipo_j[]"]:checked').map(function () { return this.value; }).get().join(', ');
            corpoTexto += `--- LIBERAÇÃO E AUTORIZADOS ---\n`;
            corpoTexto += `Forma(s) Liberação: ${liberacaoTiposJ || 'N/A'}\nAutorizados:\n`;
            $('#autorizados_container_j .dynamic-item').each(function (i) {
                corpoTexto += `  Aut ${i + 1}: Nome: ${$(this).find('[name="auth_nome_j[]"]').val()}, CPF: ${$(this).find('[name="auth_cpf_j[]"]').val()}, Depto: ${$(this).find('[name="auth_depto_j[]"]').val() || 'N/A'}\n`;
            });
            corpoTexto += `\n`;
            const conheceuJ = $('[name="conheceu_j"]:checked').val();
            corpoTexto += `--- COMO CONHECEU A LOJA ---\nForma: ${conheceuJ || 'N/A'}\n`;
            if (conheceuJ === 'Mídias Sociais') corpoTexto += `  Qual: ${$('[name=conheceu_midia_social_qual_j]').val()}\n`;
            if (conheceuJ === 'Indicação') corpoTexto += `  Quem: ${$('[name=conheceu_indicacao_qual_j]').val()}\n`;
        }
        return corpoTexto;
    }

    // --- MÁSCARAS E EVENTOS DE CAMPO ---
    function applyMasks(element) {
        $(element).find('.cpf-mask').on('input', function () { this.value = this.value.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); }).attr('maxlength', 14);
        $(element).find('.rg-mask').on('input', function () { this.value = this.value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})([0-9A-Za-z]{1})$/, "$1-$2"); }).attr('maxlength', 12);
        $(element).find('.tel-mask').on("input", function () {
            let v = this.value.replace(/\D/g, '').substring(0, 11); v = v.replace(/^(\d{2})(\d)/g, "($1) $2"); v = v.length > 10 ? v.replace(/(\d{5})(\d{4})/, "$1-$2") : v.replace(/(\d{4})(\d{4})/, "$1-$2"); this.value = v;
        });
    }
    applyMasks(document);
    $("#cnpj").on("input", function () { this.value = this.value.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2") });
    $("#cep_f, #cep_j").on("input", function () { this.value = this.value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2") });
    $('#cep_f').on('blur', function () { buscarCep(this.value, '_f') });
    $('#cep_j').on('blur', function () { buscarCep(this.value, '_j') });

    // --- NAVEGAÇÃO ---
    $('#btn_iniciar').on('click', function () {
        const tipo = $('#tipo_cliente').val();
        if (tipo === 'fisica') {
            mostrarEtapa('etapa1_fisica');
        } else if (tipo === 'juridica') {
            mostrarEtapa('etapa1_juridica');
        } else {
            $('#tipo_cliente').addClass('campo-invalido');
            alert('Por favor, selecione o tipo de cadastro.');
        }
    });
    $('.continuar').not('#btn_iniciar').on('click', function () {
        if (validarEtapa($(this).closest('.etapa'))) mostrarEtapa($(this).data('target'));
        else alert('Preencha os campos obrigatórios para continuar.');
    });
    $('.voltar').on('click', function () {
        if ($(this).hasClass('voltar-final')) $('#fallbackContainer').empty();
        mostrarEtapa($(this).data('target'));
    });

    // --- LÓGICA CONDICIONAL ---
    $('#is_condominio').on('change', function () {
        $('#condominio_contatos').slideToggle(this.checked);
        $('#checklist_pj').toggle(!this.checked);
        $('#checklist_condominio').toggle(this.checked);
        $('#auth_note').text(this.checked ? '*Obrigatório doc do Síndico e do retirante.' : '*Obrigatório doc do retirante.');
    });
    $('input[name^="conheceu_"]').on('change', function () {
        const suffix = this.name.endsWith('_f') ? '_f' : '_j';
        $(`input[name="conheceu_midia_social_qual${suffix}"], input[name="conheceu_indicacao_qual${suffix}"]`).hide();
        if (this.value === 'Mídias Sociais') $(`input[name="conheceu_midia_social_qual${suffix}"]`).show();
        else if (this.value === 'Indicação') $(`input[name="conheceu_indicacao_qual${suffix}"]`).show();
    });

    // --- CAMPOS DINÂMICOS ---
    const addDynamicItem = (containerSelector, templateFunction) => {
        const container = $(containerSelector);
        const count = container.children('.dynamic-item').length;
        const newElement = $(templateFunction(count + 1));
        container.append(newElement);
        applyMasks(newElement);
    };

    const templates = {
        socio: i => `<div class="dynamic-item"><h4>Sócio ${i}</h4><label>Nome:<input name="socio_nome[]" required></label><div class="grid-2"><label>CPF:<input name="socio_cpf[]" class="cpf-mask" required></label><label>RG:<input name="socio_rg[]" class="rg-mask" required></label></div><label>Nasc:<input type="date" name="socio_nascimento[]" required></label></div>`,
        referencia: (i, s) => `<div class="dynamic-item"><h4>Ref ${i}</h4><label>Tipo:<select name="ref_tipo${s}[]" required><option value="Fornecedor">Fornecedor</option><option value="Cliente">Cliente</option><option value="Banco">Banco</option></select></label><label>Empresa/Banco:<input name="ref_empresa${s}[]" required></label><label>Tel:<input name="ref_telefone${s}[]" class="tel-mask" required></label></div>`,
        autorizado: (i, s) => `<div class="dynamic-item"><h4>Autorizado ${i}</h4><label>Nome:<input name="auth_nome${s}[]" required></label><div class="grid-2"><label>CPF:<input name="auth_cpf${s}[]" class="cpf-mask" required></label><label>RG:<input name="auth_rg${s}[]" class="rg-mask"></label></div></div>`,
    };

    $('#add_socio_btn').on('click', () => addDynamicItem('#socios_container', templates.socio));
    $('#add_ref_btn_j').on('click', () => addDynamicItem('#referencias_container_j', i => templates.referencia(i, '_j')));
    $('#add_auth_btn_j').on('click', () => addDynamicItem('#autorizados_container_j', i => templates.autorizado(i, '_j')));
    $('#add_ref_btn_f').on('click', () => addDynamicItem('#referencias_container_f', i => templates.referencia(i, '_f')));
    $('#add_auth_btn_f').on('click', () => addDynamicItem('#autorizados_container_f', i => templates.autorizado(i, '_f')));


    // --- SUBMISSÃO E CÓPIA ---
    $('.copiar-dados').on('click', function () {
        if (!validarEtapa($(this).closest('.etapa'))) { alert('Preencha os campos obrigatórios antes de copiar.'); return; }
        navigator.clipboard.writeText(gerarCorpoTexto()).then(() => alert('Dados copiados para a área de transferência!'));
    });

    // Abre o cliente de e-mail via mailto, com encoding correto e CRLF
    function abrirMailto({ to, subject, body, cc, bcc }) {
        const params = [];
        const bodyCRLF = (body || '').replace(/\n/g, '\r\n');
        if (subject) params.push('subject=' + encodeURIComponent(subject));
        if (body) params.push('body=' + encodeURIComponent(bodyCRLF));
        if (cc) params.push('cc=' + encodeURIComponent(cc));
        if (bcc) params.push('bcc=' + encodeURIComponent(bcc));
        const query = params.length ? ('?' + params.join('&')) : '';
        const url = `mailto:${to}${query}`;
        const a = document.createElement('a');
        a.href = url;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        requestAnimationFrame(() => a.remove());
        return { url, length: url.length };
    }

    // Gera o conteúdo de um arquivo .eml (rascunho de e-mail)
    function gerarMensagemEML({ to, subject, body, replyTo }) {
        const lines = [];
        lines.push(`To: ${to}`);
        if (replyTo) lines.push(`Reply-To: ${replyTo}`);
        lines.push(`Subject: ${subject}`);
        lines.push('X-Unsent: 1');
        lines.push('MIME-Version: 1.0');
        lines.push('Content-Type: text/plain; charset=UTF-8');
        lines.push('Content-Transfer-Encoding: 8bit');
        lines.push('');
        lines.push((body || '').replace(/\r?\n/g, '\r\n'));
        return lines.join('\r\n');
    }

    function baixarEML(nomeArquivo, emlConteudo) {
        const blob = new Blob([emlConteudo], { type: 'message/rfc822' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        requestAnimationFrame(() => {
            a.remove();
            URL.revokeObjectURL(url);
        });
    }

    $('#cadastroForm').on('submit', function (e) {
        e.preventDefault();
        const $form = $(this);
        const $etapaAtiva = $form.find('.etapa.ativa');
        if (!validarEtapa($etapaAtiva)) { alert('Verifique os campos obrigatórios antes de enviar.'); return; }

        const nomeCliente = $('#nome_f').val() || $('#razao_social').val() || 'Novo Cliente';
        const assunto = `Nova Ficha Cadastral - ${nomeCliente}`;
        const corpoEmail = gerarCorpoTexto();
        const replyTo = $('#email_principal_f').val() || $('#email_principal_j').val() || '';

        const $submitBtn = $etapaAtiva.find('button[type="submit"]');
        const originalBtnText = $submitBtn.text();
        $submitBtn.prop('disabled', true).text('Abrindo e-mail...');

        // Tenta abrir o cliente de e-mail do usuário
        const { length: mailtoLength } = abrirMailto({
            to: EMAIL_DESTINO,
            subject: assunto,
            body: corpoEmail,
            // Não definimos Reply-To em mailto (não há suporte amplo)
        });

        // Monta fallback útil (sempre exibido para orientar o usuário)
        const eml = gerarMensagemEML({ to: EMAIL_DESTINO, subject: assunto, body: corpoEmail, replyTo });
        const $fb = $(`#fallbackContainer`).html(`
            <div>
                <h3>Abra seu cliente de e-mail para enviar</h3>
                <p>Tentamos abrir seu cliente de e-mail com a ficha preenchida.<br>
                Se não abriu ou o conteúdo ficou incompleto, utilize as opções abaixo.</p>
                <div class="botoes-etapa" style="gap: 8px;">
                    <button type="button" id="abrir_mailto_btn">Abrir e-mail novamente</button>
                    <button type="button" id="baixar_eml_btn">Baixar arquivo .eml</button>
                    <button type="button" class="copiar-dados" id="copiar_dados_btn">Copiar Dados</button>
                </div>
                <textarea readonly>${corpoEmail}</textarea>
                <small>Destinatário: ${EMAIL_DESTINO} • Assunto: ${assunto}</small>
                ${mailtoLength > 2000 ? '<small style="color:#d9534f">Observação: o conteúdo é grande e pode ser truncado por alguns clientes.</small>' : ''}
            </div>
        `);

        $fb.find('#abrir_mailto_btn').on('click', () => abrirMailto({ to: EMAIL_DESTINO, subject: assunto, body: corpoEmail }));
        $fb.find('#baixar_eml_btn').on('click', () => baixarEML(`Cadastro - ${nomeCliente}.eml`, eml));
        $fb.find('#copiar_dados_btn').on('click', function () {
            const txt = $(this).closest('div').find('textarea').val();
            navigator.clipboard.writeText(txt).then(() => alert('Copiado!'));
        });

        // Reabilita o botão após breve intervalo
        setTimeout(() => {
            $submitBtn.prop('disabled', false).text(originalBtnText);
        }, 800);
    });
})(jQuery);