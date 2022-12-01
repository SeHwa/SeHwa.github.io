$(document).ready(function(){
    $(".language-z80").each(function(idx, item){
        item.innerHTML = "<div class='highlight'><pre class='highlight'><b>" + highlight_z80(item.innerHTML.trim()) + "</b></pre></div>";
    });
});

function highlight_z80(html)
{
    let ret_html = "", flag = 0;

    let arr = html.split("\n");
    for( let i = 0; i < arr.length; i++ ){
        let ins = "", op1 = "", op2 = "", cmt = "";

        let line = arr[i].trim();
        let idx = line.indexOf(";");
        if( idx != -1 ){
            cmt = line.substring(idx);
            line = line.substring(0, idx).trim();
        }

        if( line.trim() == "" ){
            if( flag == 1 ) ret_html += "    ";
            ret_html += get_highlight_html(ins, op1, op2, cmt) + "\n";
            continue;
        }
        else if( line.indexOf(":") != -1 ){
            let cmt_html = "";
            if( cmt != "" ) cmt_html = get_highlight_html(ins, op1, op2, cmt);
            if( line.indexOf("equ") != -1 ){
                a = line.split("equ");
                ret_html += a[0] + "<span class='h_reg'>equ</span>" + "<span class='h_int'>" + a[1] + "</span> " + cmt_html + "\n";
            }
            else{
                flag = 1;
                ret_html += line + " " + cmt_html + "\n";
            }
            continue;
        }
        if( flag == 1 ) ret_html += "    ";

        arr2 = line.split(" ");
        ins = arr2[0];
        if( arr2.length > 1 ){
            if( ins == "db" || ins == "dw" || ins == "dd" || ins== "dq" )
                op1 = line.substring(arr2[0].length);
            else{
                arr3 = line.substring(arr2[0].length).split(",");
                op1 = arr3[0];
                if( arr3.length > 1 )
                    op2 = arr3[1];
            }
        }
        ret_html += get_highlight_html(ins.trim().toLowerCase(), op1.trim(), op2.trim(), cmt) + "\n";
    }
    return ret_html;
}

function get_highlight_html(ins, op1, op2, cmt)
{
    let html = "";
    let inso = {}, rego = {};
    let inss = ["adc","add","and","bit","call","ccf","cp","cpd","cpdr","cpi","cpir","cpl","daa","dec","di","djnz","ei","ex","exx","halt","im","in","inc","ind","indr","ini","inir","jp","jr","ld","ldd","lddr","ldi","ldir","neg","nop","or","otdr","otir","out","outd","outi","pop","push","res","ret","reti","retn","rl","rla","rlc","rlca","rld","rr","rra","rrc","rrca","rrd","rst","sbc","scf","set","sla","sll","sra","srl","sub","xor"];
    let regs = ["af","bc","de","hl","af'","bc'","de'","hl'","ix","iy","ixh","iyh","ixl","iyl","a","b","c","d","e","f","h","l","sp",           "nz","nc","po","p","z","pe","m"];

    for( let i = 0; i < inss.length; i++ )
        inso[inss[i]] = 1;
    for( let i = 0; i < regs.length; i++ )
        rego[regs[i]] = 1;

    if( ins != "" ){
        if( inso[ins] == 1 ) html += "<span class='h_ins'>" + ins + "</span>";
        else if( ins == "org" || ins == "db" || ins == "db" || ins == "dw" || ins == "dd" || ins == "dq" ){
            html += "<span class='h_reg'>" + ins + "</span>";
        }

        if( op1 != "" ){
            if( ins == "org" ){
                if( (op1[0] >= "0" && op1[0] <= "9") || op1[0] == "$" || op1[0] == "%" )
                    html += " <span class='h_int'>" + op1 + "</span>";
                else html += " " + op1;
            }
            else if( ins == "db" || ins == "db" || ins == "dw" || ins == "dd" || ins == "dq" ){
                a = op1.split(",");
                html += " ";
                for( let i = 0; i < a.length; i++ ){
                    a[i] = a[i].trim();
                    if( (a[i][0] >= "0" && a[i][0] <= "9") || a[i][0] == "$" || a[i][0] == "%" )
                        html += "<span class='h_int'>" + a[i] + "</span>";
                    else html += a[i];
                    if( i != a.length - 1 ) html += ",";                    
                }
            }
            else{
                if( (op1[0] >= "0" && op1[0] <= "9") || op1[0] == "$" || op1[0] == "%" )
                    html += " <span class='h_int'>" + op1 + "</span>";
                else if( op1.indexOf("(") != -1 ){
                    html += " <span class='h_prt'>(</span>";
                    s = op1.substring(1, op1.length - 1);
                    if( s.indexOf("+") != -1 ){
                        a = s.split("+");
                        if( (a[0][0] >= "0" && a[0][0] <= "9") || a[0][0] == "$" || a[0][0] == "%" )
                            html += "<span class='h_int'>" + a[0] + "</span>";
                        else if( rego[a[0].trim().toLowerCase()] == 1 )
                            html += "<span class='h_reg'>" + a[0] + "</span>";
                        else html += a[0];
                        html += "+";
                        if( (a[1][0] >= "0" && a[1][0] <= "9") || a[1][0] == "$" || a[1][0] == "%" )
                            html += "<span class='h_int'>" + a[1] + "</span>";
                        else if( rego[a[1].trim().toLowerCase()] == 1 )
                            html += "<span class='h_reg'>" + a[1] + "</span>";
                        else html += a[1];
                    }
                    else if( s.indexOf("-") != -1 ){
                        a = s.split("-");
                        if( (a[0][0] >= "0" && a[0][0] <= "9") || a[0][0] == "$" || a[0][0] == "%" )
                            html += "<span class='h_int'>" + a[0] + "</span>";
                        else if( rego[a[0].trim().toLowerCase()] == 1 )
                            html += "<span class='h_reg'>" + a[0] + "</span>";
                        else html += a[0];
                        html += "-";
                        if( (a[1][0] >= "0" && a[1][0] <= "9") || a[1][0] == "$" || a[1][0] == "%" )
                            html += "<span class='h_int'>" + a[1] + "</span>";
                        else if( rego[a[1].trim().toLowerCase()] == 1 )
                            html += "<span class='h_reg'>" + a[1] + "</span>";
                        else html += a[1];
                    }
                    else{
                        if( (s[0] >= "0" && s[0] <= "9") || s[0] == "$" || s[0] == "%" )
                            html += "<span class='h_int'>" + s + "</span>";
                        else if( rego[s] == 1 )
                            html += "<span class='h_reg'>" + s + "</span>";
                        else html += s;
                    }
                    html += "<span class='h_prt'>)</span>";
                }
                else if( rego[op1.trim().toLowerCase()] == 1 )
                    html += " <span class='h_reg'>" + op1 + "</span>";
                else html += " " + op1;

                if( op2 != "" ){
                    html += ", ";
                    if( op2.indexOf("(") != -1 ){
                        html += "<span class='h_prt'>(</span>";
                        s = op2.substring(1, op2.length - 1);
                        if( s.indexOf("+") != -1 ){
                            a = s.split("+");
                            if( (a[0][0] >= "0" && a[0][0] <= "9") || a[0][0] == "$" || a[0][0] == "%" )
                                html += "<span class='h_int'>" + a[0] + "</span>";
                            else if( rego[a[0].trim().toLowerCase()] == 1 )
                                html += "<span class='h_reg'>" + a[0] + "</span>";
                            else html += a[0];
                            html += "+";
                            if( (a[1][0] >= "0" && a[1][0] <= "9") || a[1][0] == "$" || a[1][0] == "%" )
                                html += "<span class='h_int'>" + a[1] + "</span>";
                            else if( rego[a[1].trim().toLowerCase()] == 1 )
                                html += "<span class='h_reg'>" + a[1] + "</span>";
                            else html += a[1];
                        }
                        else if( s.indexOf("-") != -1 ){
                            a = s.split("-");
                            if( (a[0][0] >= "0" && a[0][0] <= "9") || a[0][0] == "$" || a[0][0] == "%" )
                                html += "<span class='h_int'>" + a[0] + "</span>";
                            else if( rego[a[0].trim().toLowerCase()] == 1 )
                                html += "<span class='h_reg'>" + a[0] + "</span>";
                            else html += a[0];
                            html += "-";
                            if( (a[1][0] >= "0" && a[1][0] <= "9") || a[1][0] == "$" || a[1][0] == "%" )
                                html += "<span class='h_int'>" + a[1] + "</span>";
                            else if( rego[a[1].trim().toLowerCase()] == 1 )
                                html += "<span class='h_reg'>" + a[1] + "</span>";
                            else html += a[1];
                        }
                        else{
                            if( (s[0] >= "0" && s[0] <= "9") || s[0] == "$" || s[0] == "%" )
                                html += "<span class='h_int'>" + s + "</span>";
                            else if( rego[s] == 1 )
                                html += "<span class='h_reg'>" + s + "</span>";
                            else html += s;
                        }
                        html += "<span class='h_prt'>)</span>";
                    }
                    else if( op2.indexOf("+") != -1 ){
                        a = op2.split("+");
                        if( (a[0][0] >= "0" && a[0][0] <= "9") || a[0][0] == "$" || a[0][0] == "%" )
                            html += "<span class='h_int'>" + a[0] + "</span>";
                        else if( rego[a[0].trim().toLowerCase()] == 1 )
                            html += "<span class='h_reg'>" + a[0] + "</span>";
                        else html += a[0];
                        html += "+";
                        if( (a[1][0] >= "0" && a[1][0] <= "9") || a[1][0] == "$" || a[1][0] == "%" )
                            html += "<span class='h_int'>" + a[1] + "</span>";
                        else if( rego[a[1].trim().toLowerCase()] == 1 )
                            html += "<span class='h_reg'>" + a[1] + "</span>";
                        else html += a[1];
                    }
                    else if( op2.indexOf("-") != -1 ){
                        a = op2.split("-");
                        if( (a[0][0] >= "0" && a[0][0] <= "9") || a[0][0] == "$" || a[0][0] == "%" )
                            html += "<span class='h_int'>" + a[0] + "</span>";
                        else if( rego[a[0].trim().toLowerCase()] == 1 )
                            html += "<span class='h_reg'>" + a[0] + "</span>";
                        else html += a[0];
                        html += "-";
                        if( (a[1][0] >= "0" && a[1][0] <= "9") || a[1][0] == "$" || a[1][0] == "%" )
                            html += "<span class='h_int'>" + a[1] + "</span>";
                        else if( rego[a[1].trim().toLowerCase()] == 1 )
                            html += "<span class='h_reg'>" + a[1] + "</span>";
                        else html += a[1];
                    }
                    else if( (op2[0] >= "0" && op2[0] <= "9") || op2[0] == "$" || op2[0] == "%" )
                        html += "<span class='h_int'>" + op2 + "</span>";
                    else if( rego[op2.trim().toLowerCase()] == 1 )
                        html += "<span class='h_reg'>" + op2 + "</span>";
                    else html += op2;
                }
            }
        }
    }

    if( cmt != "" && ins != "" ) html += " ";
    if( cmt != "" ) html += "<span class='h_cmt'>" + cmt + "</span>";
    return html;
}